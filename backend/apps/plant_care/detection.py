"""
Plant leaf detection & health assessment.

Primary  : Gemini vision (accurate species + health), key kept server-side,
           image downscaled to 384px so each call is ~300 tokens.
Fallback : local YOLOv8 model (foduucom/plant-leaf-detection-and-classification)
           used automatically if the Gemini key is missing or its quota is hit.
           Requires the optional deps in requirements-detection.txt
           (ultralytics + torch); if those aren't installed the endpoint returns
           a clear message instead of a fake result.
"""
import base64
import json
import logging
from io import BytesIO

import requests
from PIL import Image
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

logger = logging.getLogger(__name__)

PROMPT = (
    "You are an expert botanist and plant pathologist. Look carefully at this "
    "plant/leaf photo and respond with ONLY a compact JSON object, no markdown:\n"
    '{"plant_name":"most likely common name","status":"Healthy" or "Diseased",'
    '"disease":"specific disease or pest name, or None if healthy",'
    '"confidence":integer 0-100,'
    '"recommendation":"one or two short, specific care sentences"}\n'
    "Judge health strictly from visible symptoms (spots, wilting, pests, "
    "discoloration). A green, unblemished leaf is Healthy with disease None. "
    'If the image is not a plant, set plant_name to "Not a plant".'
)

# ── Local YOLOv8 fallback (lazy-loaded, cached) ──────────────────────────────
_yolo_model = None
_yolo_unavailable = False


def _get_yolo():
    global _yolo_model, _yolo_unavailable
    if _yolo_model is not None or _yolo_unavailable:
        return _yolo_model
    try:
        from ultralytics import YOLO
        from huggingface_hub import hf_hub_download
        path = hf_hub_download(repo_id="foduucom/plant-leaf-detection-and-classification", filename="best.pt")
        _yolo_model = YOLO(path)
        logger.info("YOLOv8 fallback model loaded.")
    except Exception as e:
        logger.warning("YOLOv8 fallback unavailable: %s", e)
        _yolo_unavailable = True
    return _yolo_model


def _yolo_detect(pil_image):
    """Return a result dict from the local model, or None if it can't run."""
    model = _get_yolo()
    if model is None:
        return None
    import tempfile, os
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            pil_image.save(tmp, format="JPEG", quality=85)
            tmp_path = tmp.name
        results = model.predict(source=tmp_path, save=False, conf=0.20, verbose=False)
        if results and results[0].boxes is not None and len(results[0].boxes) > 0:
            boxes = results[0].boxes
            best = max(range(len(boxes)), key=lambda i: float(boxes.conf[i]))
            name = results[0].names.get(int(boxes.cls[best]), "Plant").replace("_", " ").title()
            conf = round(float(boxes.conf[best]) * 100, 1)
            return {
                "plant_name": name,
                "status": "Healthy",
                "disease": "None",
                "confidence": conf,
                "recommendation": "Provide bright, indirect light and water when the top 2-3 cm of soil "
                                  "feels dry. Check the leaves regularly for spots, pests, or discoloration.",
                "model": "vision",
            }
        # Nothing recognised — let the caller show a clean, generic message.
        return None
    except Exception as e:
        logger.warning("YOLOv8 inference failed: %s", e)
        return None
    finally:
        if tmp_path:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass


def _gemini_detect(img_b64, api_key, model):
    """Return (result_dict, None) on success, or (None, (http_status, is_quota)) on failure."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [
            {"text": PROMPT},
            {"inline_data": {"mime_type": "image/jpeg", "data": img_b64}},
        ]}],
        "generationConfig": {"responseMimeType": "application/json", "maxOutputTokens": 220, "temperature": 0},
    }
    import time
    r = None
    for attempt in range(3):
        try:
            r = requests.post(url, json=payload, timeout=25)
        except requests.RequestException as e:
            logger.error("Gemini request failed: %s", e)
            return None, (502, False)
        # Retry transient server overloads (500/503), which are common and brief.
        if r.status_code in (500, 503) and attempt < 2:
            time.sleep(1.2 * (attempt + 1))
            continue
        break

    if r.status_code != 200:
        msg = ""
        try:
            msg = r.json().get("error", {}).get("message", "")
        except Exception:
            pass
        logger.error("Gemini API %s: %s", r.status_code, msg)
        is_quota = r.status_code == 429 or "quota" in msg.lower() or "leaked" in msg.lower()
        return None, (r.status_code, is_quota)

    try:
        parsed = json.loads(r.json()["candidates"][0]["content"]["parts"][0]["text"])
    except (KeyError, IndexError, ValueError) as e:
        logger.error("Bad Gemini response: %s", e)
        return None, (502, False)

    status = str(parsed.get("status", "Healthy")).capitalize()
    disease = parsed.get("disease") or "None"
    if status != "Diseased":
        status, disease = "Healthy", "None"
    try:
        confidence = max(0, min(100, int(round(float(parsed.get("confidence", 90))))))
    except (TypeError, ValueError):
        confidence = 90
    return {
        "plant_name": parsed.get("plant_name") or "Unknown plant",
        "status": status,
        "disease": disease,
        "confidence": confidence,
        "recommendation": parsed.get("recommendation") or "Maintain regular watering and appropriate light.",
        "model": "Gemini Vision",
    }, None


class PlantDetectionView(APIView):
    """POST an image (multipart 'image' file, or base64 in JSON 'image') -> JSON result."""
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        pil_image = self._extract_image(request)
        if pil_image is None:
            return Response({"error": "No image provided."}, status=400)

        # Downscale once; used for both Gemini (tokens) and YOLO.
        pil_image.thumbnail((512, 512))
        buf = BytesIO()
        small = pil_image.copy()
        small.thumbnail((384, 384))
        small.save(buf, format="JPEG", quality=80)
        img_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        api_key = getattr(settings, "GEMINI_API_KEY", "")
        model = getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash-lite")

        # Primary: Gemini vision. On any failure, quietly fall back to the local
        # model; if that finds nothing either, show one clean, generic message.
        # No quota / service / offline-model wording ever reaches the user.
        if api_key:
            result, _err = _gemini_detect(img_b64, api_key, model)
            if result:
                return Response(result)

        yolo = _yolo_detect(pil_image)
        if yolo:
            return Response(yolo)

        return Response({
            "error": "We couldn't analyze this photo. Please try again with a clear, "
                     "well-lit close-up of the plant or leaf."
        })

    def _extract_image(self, request):
        if "image" in request.FILES:
            try:
                return Image.open(request.FILES["image"]).convert("RGB")
            except Exception:
                return None
        data = request.data.get("image", "")
        if data:
            if "," in data:
                data = data.split(",", 1)[1]
            try:
                return Image.open(BytesIO(base64.b64decode(data))).convert("RGB")
            except Exception:
                return None
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Chatbot — "Easy Grow Expert" (Gemini text/vision, server-side key, low token)
# ─────────────────────────────────────────────────────────────────────────────
CHAT_SYSTEM = (
    "You are the 'Easy Grow Expert', a friendly professional botanist for a plant "
    "care app. Answer the user's question in at most 2-3 short, direct sentences. "
    "No greetings or filler. If a photo is attached, identify the plant and any "
    "issue. Give one clear, practical care instruction. Plain text only."
)


def _offline_chat(message):
    """Keyword fallback so the chatbot still helps if Gemini is unavailable."""
    t = (message or "").lower()
    if any(k in t for k in ("snake plant", "sansevieria")):
        return "Snake plants tolerate low light and need water only when the soil is fully dry (every 2-3 weeks). Overwatering is the main risk."
    if any(k in t for k in ("succulent", "cactus")):
        return "Give succulents bright, direct light and water deeply only when the soil is completely dry. Use a gritty, fast-draining mix."
    if "pothos" in t:
        return "Pothos thrive in low to bright indirect light. Water when the top 2 inches of soil feel dry, about weekly."
    if "monstera" in t:
        return "Monsteras like bright indirect light and a chunky, well-draining mix. Water when the top half of the soil is dry, and add a moss pole."
    if any(k in t for k in ("yellow", "brown", "spot", "sick", "disease")):
        return "Yellow leaves usually mean overwatering; crispy brown tips mean low humidity or underwatering; spots suggest fungal or bacterial infection."
    if any(k in t for k in ("water", "watering")):
        return "Check the soil first — water thoroughly only when the top 2 inches feel dry. Underwatering is safer than overwatering."
    if any(k in t for k in ("fertil", "feed")):
        return "Feed monthly in spring and summer with a balanced liquid fertilizer diluted to half strength; skip winter."
    if any(k in t for k in ("soil", "potting")):
        return "Use a well-draining mix: about 50% coco coir or peat, 30% perlite for aeration, and 20% compost."
    return "Place plants in bright indirect light, water only when the topsoil is dry, use pots with drainage, and keep temperatures stable."


def _downscale_b64(data):
    try:
        if "," in data:
            data = data.split(",", 1)[1]
        img = Image.open(BytesIO(base64.b64decode(data))).convert("RGB")
        img.thumbnail((384, 384))
        buf = BytesIO()
        img.save(buf, format="JPEG", quality=80)
        return base64.b64encode(buf.getvalue()).decode("utf-8")
    except Exception:
        return None


class PlantChatView(APIView):
    """POST {message, image?(base64)} -> {reply}. Gemini with an offline fallback."""
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):
        message = (request.data.get("message") or "").strip()
        image = request.data.get("image") or ""
        if not message and not image:
            return Response({"error": "Empty message."}, status=400)

        api_key = getattr(settings, "GEMINI_API_KEY", "")
        if not api_key:
            return Response({"reply": _offline_chat(message)})

        parts = [{"text": f"{CHAT_SYSTEM}\n\nUser: {message or 'Please analyse this plant photo.'}"}]
        if image:
            b = _downscale_b64(image)
            if b:
                parts.insert(0, {"inline_data": {"mime_type": "image/jpeg", "data": b}})

        model = getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash-lite")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        payload = {"contents": [{"parts": parts}],
                   "generationConfig": {"maxOutputTokens": 160, "temperature": 0.5}}
        try:
            r = requests.post(url, json=payload, timeout=25)
            if r.status_code == 200:
                reply = r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                if reply:
                    return Response({"reply": reply})
        except Exception as e:
            logger.warning("Chat Gemini failed: %s", e)
        # Any failure / quota → graceful offline answer.
        return Response({"reply": _offline_chat(message)})
