import random
import time
import requests
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Device, DeviceReading, ChatLog
from .serializers import DeviceSerializer, DeviceReadingSerializer, ChatLogSerializer
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
            return Response({"error": "No IP address"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            r = requests.get(f"http://{device.ip_address}/data", timeout=5)
            return Response(r.json())
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)

    @action(detail=True, methods=['get'])
    def water(self, request, device_id=None):
        device = self.get_object()
        if not device.ip_address:
            return Response({"error": "No IP address"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            r = requests.get(f"http://{device.ip_address}/water", timeout=5)
            return Response({"status": "command sent", "device_response": r.status_code})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)

    @action(detail=True, methods=['post'], url_path='sensor-data')
    def receive_sensor_data(self, request, device_id=None):
        device = self.get_object()
        data = request.data
        
        reading = DeviceReading.objects.create(
            device=device,
            soil_moisture=data.get('moisture', 0),
            temperature=data.get('temp', 0),
            water_level=data.get('water_level', 0)
        )
        
        return Response({"status": "success", "id": reading.id}, status=status.HTTP_201_CREATED)

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
