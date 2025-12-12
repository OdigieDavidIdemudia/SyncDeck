import requests

def test_testadmin_login():
    url = "http://127.0.0.1:8000/token"
    data = {
        "username": "testadmin",
        "password": "test123"
    }
    try:
        response = requests.post(url, data=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        if response.status_code == 200:
            print("✅ Login successful!")
        else:
            print("❌ Login failed!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_testadmin_login()
