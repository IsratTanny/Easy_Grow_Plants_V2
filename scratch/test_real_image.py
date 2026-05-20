import base64
import requests
from io import BytesIO

# Download a sample diseased leaf image (tomato early blight)
image_url = "https://t4.ftcdn.net/jpg/04/86/09/25/360_F_486092572_44Wv2BqV08WjP0f5s0v6q2Y359G8Y2s9.jpg"
print(f"Downloading image from {image_url}...")
response = requests.get(image_url)
image_bytes = response.content

# Convert to base64
base64_encoded = base64.b64encode(image_bytes).decode('utf-8')
base64_image = f"data:image/jpeg;base64,{base64_encoded}"

url = "http://127.0.0.1:8000/api/plant-care/detect/"
payload = {"image": base64_image}

try:
    print("Sending POST request to:", url)
    response = requests.post(url, json=payload, timeout=30)
    print("Status Code:", response.status_code)
    print("Response JSON:")
    import json
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print("Error:", e)
