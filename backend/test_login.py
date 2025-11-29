import requests

def test_login():
    url = "http://127.0.0.1:8000/token"
    data = {
        "username": "admin",
        "password": "admin"
    }
    try:
        response = requests.post(url, data=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login()
