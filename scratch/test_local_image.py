import base64
import requests
import json

file_path = "frontend/public/images/aglaonema-abidjan.jpg"

with open(file_path, "rb") as image_file:
    base64_encoded = base64.b64encode(image_file.read()).decode('utf-8')
    base64_image = f"data:image/jpeg;base64,{base64_encoded}"

url = "http://127.0.0.1:8000/api/plant-care/detect/"
payload = {"image": base64_image}

try:
    print(f"Sending POST request to {url} with {file_path}...")
    response = requests.post(url, json=payload, timeout=30)
    print("Status Code:", response.status_code)
    print("Response JSON:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print("Error:", e)
