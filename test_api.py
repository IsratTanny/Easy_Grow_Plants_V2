import requests
import json

def test_api():
    try:
        response = requests.get('http://127.0.0.1:8000/api/plants/')
        data = response.json()
        print(f"STATUS: {response.status_code}")
        print(f"COUNT: {len(data)}")
        sellers = set([d.get('seller_username') for d in data])
        print(f"SELLERS IN JSON: {sellers}")
        
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_api()
