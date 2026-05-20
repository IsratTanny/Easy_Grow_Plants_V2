import base64
import requests

# Create a tiny 1x1 transparent pixel in base64 to send to the endpoint
tiny_png_b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

url = "http://127.0.0.1:8000/api/plant-care/detect/"
payload = {"image": tiny_png_b64}

try:
    print("Sending POST request to:", url)
    response = requests.post(url, json=payload, timeout=20)
    print("Status Code:", response.status_code)
    print("Response JSON:")
    print(response.json())
except Exception as e:
    print("Error:", e)
