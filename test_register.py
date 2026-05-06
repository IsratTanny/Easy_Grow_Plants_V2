import requests
import sys
import uuid

url = "http://127.0.0.1:8000/api/auth/register/"
payload = {
    'username': f'testuser{uuid.uuid4().hex[:6]}',
    'password': 'testpassword123',
    'email': f'seller{uuid.uuid4().hex[:6]}@noemail.com',
    'phone': '',
    'role': 'buyer'
}

response = requests.post(url, data=payload)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")
