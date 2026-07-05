import base64
import random
import time
from io import BytesIO

import requests
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.conf import settings
from .models import Device, DeviceReading, ChatLog, WateringLog
from .serializers import DeviceSerializer, DeviceReadingSerializer, ChatLogSerializer
from django.utils import timezone


def _offline_care_guide(plant_name):
    """Generic care guide used when Gemini is unavailable (no key / quota)."""
    name = plant_name or "your plant"
    return (
        f"Care guide for {name}:\n"
        "• Light: Bright, indirect light. Avoid harsh direct afternoon sun.\n"
        "• Water: Only when the top 2-3 cm of soil feels dry; empty any saucer so roots never sit in water.\n"
        "• Soil: A well-draining potting mix with some perlite.\n"
        "• Feeding: A balanced liquid fertilizer once a month in spring and summer.\n"
        "• Watch for: Yellow leaves usually mean overwatering; crispy brown tips mean underwatering or dry air."
    )


def _generate_care_guide(device):
    """Build a short, specific care guide from the device's plant info + photo.
    Uses Gemini (low token) with a graceful offline fallback."""
    api_key = getattr(settings, "GEMINI_API_KEY", "")
    if not api_key:
        return _offline_care_guide(device.plant_name)

    prompt = (
        "You are a plant-care expert. Write a concise care guide for this houseplant "
        "as 5 short bullet lines covering Light, Water, Soil, Feeding, and one common "
        "problem to watch for. Plain text, no markdown headers.\n"
        f"Plant name: {device.plant_name or 'unknown'}. "
        f"Nickname/location: {device.nickname or 'indoor'}. "
        f"Owner waters when soil moisture drops below {device.moisture_threshold}%."
    )
    parts = [{"text": prompt}]

    # Attach the plant photo (downscaled) if one was uploaded, so the guide can be
    # tailored to the actual plant. Kept tiny to minimise tokens.
    if device.plant_image:
        try:
            from PIL import Image
            device.plant_image.open("rb")
            img = Image.open(device.plant_image).convert("RGB")
            img.thumbnail((384, 384))
            buf = BytesIO()
            img.save(buf, format="JPEG", quality=80)
            b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
            parts.insert(0, {"inline_data": {"mime_type": "image/jpeg", "data": b64}})
        except Exception:
            pass
        finally:
            try:
                device.plant_image.close()
            except Exception:
                pass

    model = getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash-lite")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {"contents": [{"parts": parts}],
               "generationConfig": {"maxOutputTokens": 260, "temperature": 0.4}}
    try:
        r = requests.post(url, json=payload, timeout=25)
        if r.status_code == 200:
            text = r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            if text:
                return text
    except Exception:
        pass
    return _offline_care_guide(device.plant_name)


class DeviceViewSet(viewsets.ModelViewSet):
    serializer_class = DeviceSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    lookup_field = 'device_id'

    def get_queryset(self):
        return Device.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        # If the plant identity changed, drop the cached guide so it regenerates.
        old = self.get_object()
        old_name, old_img = old.plant_name, bool(old.plant_image)
        instance = serializer.save()
        if instance.plant_name != old_name or bool(instance.plant_image) != old_img:
            if instance.care_guide:
                instance.care_guide = ''
                instance.save(update_fields=['care_guide'])

    @action(detail=True, methods=['post', 'get'], url_path='care-guide')
    def care_guide(self, request, device_id=None):
        """Return the stored care guide, regenerating it when missing or when
        ?refresh=1 is passed (e.g. after editing the plant name/photo)."""
        device = self.get_object()
        refresh = str(request.query_params.get('refresh', '')).lower() in ('1', 'true', 'yes')
        if refresh or not device.care_guide:
            device.care_guide = _generate_care_guide(device)
            device.save(update_fields=['care_guide'])
        return Response({"care_guide": device.care_guide})

    @action(detail=True, methods=['get'], url_path='control-pump')
    def toggle_pump(self, request, device_id=None):
        device = self.get_object()
        # In a real app, this would send a signal to the hardware
        # For now, we'll just mock it like the microservice
        new_state = random.choice([True, False]) # Simulating a toggle or state check
        status_str = "ON" if new_state else "OFF"
        return Response({"device_id": device.device_id, "pump_status": status_str})

    @action(detail=True, methods=['get'])
    def status(self, request, device_id=None):
        device = self.get_object()
        if not device.ip_address:
            return Response({"success": False, "message": "No IP address configured.", "data": {}}, status=status.HTTP_400_BAD_REQUEST)
        try:
            r = requests.get(f"http://{device.ip_address}/data", timeout=3)
            r.raise_for_status()
            data = r.json()
            
            # Update heartbeat since we got a valid response
            device.last_seen = timezone.now()
            device.save(update_fields=['last_seen'])
            
            return Response({"success": True, "message": "Device status retrieved", "data": data})
        except requests.exceptions.Timeout:
            return Response({"success": False, "message": "Connection timed out. Device might be offline.", "data": {}}, status=status.HTTP_504_GATEWAY_TIMEOUT)
        except Exception as e:
            return Response({"success": False, "message": f"Device unreachable: {str(e)}", "data": {}}, status=status.HTTP_502_BAD_GATEWAY)

    @action(detail=True, methods=['post'])
    def water(self, request, device_id=None):
        device = self.get_object()
        if not device.ip_address:
            return Response({"success": False, "message": "No IP address configured.", "data": {}}, status=status.HTTP_400_BAD_REQUEST)
            
        if not device.is_online:
            return Response({"success": False, "message": "Device is offline. Cannot send command.", "data": {}}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # Implementation of 60-second cooldown
        if device.last_watered_at:
            seconds_since_last = (timezone.now() - device.last_watered_at).total_seconds()
            if seconds_since_last < 60:
                wait_time = int(60 - seconds_since_last)
                return Response({
                    "success": False, 
                    "message": f"Cooldown active. Please wait {wait_time} seconds before watering again.",
                    "data": {"wait_time": wait_time}
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        duration = request.data.get('duration', device.pump_duration_seconds)
        try:
            duration = int(duration)
            duration = max(1, min(10, duration))  # Clamp between 1 and 10 seconds
        except ValueError:
            duration = device.pump_duration_seconds

        try:
            r = requests.get(f"http://{device.ip_address}/water?duration={duration}", timeout=3)
            r.raise_for_status()
            
            device.last_watered_at = timezone.now()
            device.save(update_fields=['last_watered_at'])
            
            WateringLog.objects.create(
                device=device,
                trigger_type='manual',
                duration_seconds=duration,
                success=True,
                response=f"HTTP {r.status_code}"
            )
            return Response({"success": True, "message": f"Watering command sent for {duration} seconds.", "data": {"duration": duration}})
            
        except requests.exceptions.Timeout:
            WateringLog.objects.create(device=device, trigger_type='manual', duration_seconds=duration, success=False, response="Timeout")
            return Response({"success": False, "message": "Connection timed out. Pump may not have started.", "data": {}}, status=status.HTTP_504_GATEWAY_TIMEOUT)
        except Exception as e:
            WateringLog.objects.create(device=device, trigger_type='manual', duration_seconds=duration, success=False, response=str(e)[:250])
            return Response({"success": False, "message": f"Command failed: {str(e)}", "data": {}}, status=status.HTTP_502_BAD_GATEWAY)

    @action(detail=True, methods=['post'], url_path='sensor-data', permission_classes=[permissions.AllowAny])
    def receive_sensor_data(self, request, device_id=None):
        try:
            device = Device.objects.get(device_id=device_id)
        except Device.DoesNotExist:
            return Response({"success": False, "message": "Device not found"}, status=status.HTTP_404_NOT_FOUND)
        data = request.data
        
        # Update heartbeat and IP address
        device.last_seen = timezone.now()
        
        # Automatically update IP address if it has changed
        # We can get it from the request metadata or the payload
        remote_ip = request.META.get('REMOTE_ADDR')
        if remote_ip and remote_ip != '127.0.0.1' and device.ip_address != remote_ip:
            device.ip_address = remote_ip
            
        device.save(update_fields=['last_seen', 'ip_address'])
        
        reading = DeviceReading.objects.create(
            device=device,
            soil_moisture=data.get('moisture', 0),
            soil_raw=data.get('soil_raw', 0),
            temperature=data.get('temp', 0),
            water_level=data.get('water_level', 0),
            pump_status=data.get('pump_status', False)
        )
        
        return Response({"success": True, "message": "Telemetry saved", "data": {"id": reading.id}}, status=status.HTTP_201_CREATED)

class ChatViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request):
        user_msg = request.data.get('message', '').lower()
        
        # Mock AI Logic from microservice
        if "water" in user_msg:
            response = "Most indoor plants need watering when the top inch of soil is dry. Check your specific plant's needs!"
        elif "sun" in user_msg or "light" in user_msg:
            response = "Ensure your plant gets adequate light. South-facing windows are usually best for high-light plants."
        elif "yellow" in user_msg:
            response = "Yellow leaves can indicate overwatering or nutrient deficiency. Check the soil moisture first."
        else:
            response = "I'm a botanical expert AI. Ask me about watering, sunlight, or plant health!"
            
        # Log to database
        ChatLog.objects.create(
            user=request.user,
            message=user_msg,
            bot_response=response
        )
        
        return Response({"response": response, "confidence": 0.95})

class DiagnosisViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    def create(self, request):
        # Mock diagnosis logic
        diseases = ["Leaf Spot", "Root Rot", "Powdery Mildew", "Healthy"]
        diagnosis = random.choice(diseases)
        confidence = random.randint(70, 99)
        
        return Response({
            "diagnosis": diagnosis,
            "confidence": f"{confidence}%",
            "recommendation": "Isolate the plant and check humidity levels." if diagnosis != "Healthy" else "Keep up the good work!"
        })

class ChatLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ChatLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChatLog.objects.filter(user=self.request.user)
