import random
import time
import requests
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Device, DeviceReading, ChatLog, WateringLog
from .serializers import DeviceSerializer, DeviceReadingSerializer, ChatLogSerializer
from django.utils import timezone
class DeviceViewSet(viewsets.ModelViewSet):
    serializer_class = DeviceSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'device_id'

    def get_queryset(self):
        return Device.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

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
        
        # Update heartbeat
        device.last_seen = timezone.now()
        device.save(update_fields=['last_seen'])
        
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
