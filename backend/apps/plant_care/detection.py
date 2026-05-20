"""
Plant Leaf Detection & Classification using YOLOv8 & Gemini AI Hybrid Pipeline
Model: foduucom/plant-leaf-detection-and-classification (HuggingFace)
"""
import os
import base64
import tempfile
import logging
import requests
import json
from io import BytesIO
from PIL import Image

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

logger = logging.getLogger(__name__)

# Global model cache to avoid reloading on every request
_model = None

def get_model():
    """Lazily load and cache the YOLOv8 model from HuggingFace."""
    global _model
    if _model is None:
        try:
            from ultralytics import YOLO
            from huggingface_hub import hf_hub_download
            logger.info("Loading YOLOv8 plant detection model via hf_hub_download...")
            # Download model weight file directly from HF hub
            model_path = hf_hub_download(
                repo_id="foduucom/plant-leaf-detection-and-classification", 
                filename="best.pt"
            )
            _model = YOLO(model_path)
            logger.info("YOLOv8 model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load YOLOv8 model: {e}")
            raise
    return _model


# Fallback recommendations mapped to common detections
RECOMMENDATIONS = {
    "healthy": "Your plant looks great! Keep up the current care routine with proper watering and sunlight.",
    "leaf_spot": "Detected Leaf Spot disease. Remove affected leaves, improve air circulation, and avoid overhead watering.",
    "powdery_mildew": "Powdery Mildew detected. Apply a fungicide spray and ensure good airflow around the plant.",
    "rust": "Rust disease detected. Remove infected leaves and apply a copper-based fungicide.",
    "blight": "Blight detected. Remove all affected tissue immediately and apply appropriate fungicide treatment.",
    "nutrient_deficiency": "Signs of nutrient deficiency. Consider a balanced fertilizer and check soil pH levels.",
    "pest_damage": "Pest damage detected. Inspect the plant closely and apply appropriate insecticide or neem oil.",
    "default_diseased": "Disease detected on your plant. Isolate the plant, remove affected leaves, and consider appropriate care.",
    "default_healthy": "No significant issues detected. Maintain regular watering and appropriate light conditions.",
}


def get_recommendation(class_name, is_healthy):
    """Get care recommendation based on detection class."""
    key = class_name.lower().replace(" ", "_").replace("-", "_")
    if is_healthy:
        return RECOMMENDATIONS.get(key, RECOMMENDATIONS["default_healthy"])
    return RECOMMENDATIONS.get(key, RECOMMENDATIONS["default_diseased"])


class PlantDetectionView(APIView):
    """
    API endpoint for plant leaf detection and classification.
    Accepts either:
      - A base64-encoded image in JSON body: {"image": "data:image/jpeg;base64,..."}
      - A file upload via multipart form: file field named "image"
    """
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        try:
            # 1. Extract image
            raw_base64 = request.data.get("image", "")
            pil_image = self._extract_image(request)
            if pil_image is None:
                return Response(
                    {"error": "No image provided. Send base64 in 'image' field or upload a file."},
                    status=400
                )

            # If multipart file uploaded, convert to base64 for Gemini
            if not raw_base64:
                buffered = BytesIO()
                pil_image.save(buffered, format="JPEG")
                raw_base64 = "data:image/jpeg;base64," + base64.b64encode(buffered.getvalue()).decode("utf-8")

            # 2. Run Local YOLOv8 Detection to identify plant species and bounding box
            detections = []
            yolo_plant_name = "Unknown Plant"
            yolo_confidence = 0
            
            try:
                with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
                    pil_image.save(tmp, format="JPEG", quality=85)
                    tmp_path = tmp.name

                try:
                    model = get_model()
                    results = model.predict(source=tmp_path, save=False, conf=0.20, verbose=False)
                finally:
                    if os.path.exists(tmp_path):
                        os.unlink(tmp_path)

                if results and len(results) > 0:
                    result = results[0]
                    if result.boxes is not None and len(result.boxes) > 0:
                        for box in result.boxes:
                            cls_id = int(box.cls[0])
                            conf = float(box.conf[0])
                            class_name = result.names.get(cls_id, f"class_{cls_id}")
                            coords = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
                            detections.append({
                                "class": class_name,
                                "confidence": round(conf * 100, 1),
                                "bbox": [round(c, 1) for c in coords],
                            })
                        
                        # Sort by confidence, set primary detection
                        detections.sort(key=lambda d: d["confidence"], reverse=True)
                        yolo_plant_name = detections[0]["class"].replace("_", " ").title()
                        yolo_confidence = detections[0]["confidence"]
            except Exception as yolo_err:
                logger.warning(f"Local YOLOv8 inference failed: {yolo_err}")

            # Return the YOLOv8 detection result
            # The frontend will use this plant name as a hint for the Gemini helper
            return Response({
                "plant_name": yolo_plant_name,
                "confidence": yolo_confidence,
                "all_detections": detections,
                "model": "YOLOv8 (foduucom/plant-leaf-detection-and-classification)"
            })

        except Exception as e:
            logger.error(f"Plant detection error: {e}", exc_info=True)
            return Response(
                {"error": f"Detection failed: {str(e)}"},
                status=500
            )

    def _extract_image(self, request):
        """Extract PIL Image from either base64 JSON or file upload."""
        # Check for file upload
        if "image" in request.FILES:
            file = request.FILES["image"]
            return Image.open(file).convert("RGB")

        # Check for base64 in JSON body
        base64_data = request.data.get("image", "")
        if base64_data:
            # Strip data URL prefix if present
            if "," in base64_data:
                base64_data = base64_data.split(",", 1)[1]
            try:
                img_bytes = base64.b64decode(base64_data)
                return Image.open(BytesIO(img_bytes)).convert("RGB")
            except Exception as e:
                logger.warning(f"Failed to decode base64 image: {e}")
                return None

        return None
