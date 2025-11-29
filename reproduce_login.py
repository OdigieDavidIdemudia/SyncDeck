import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_login(username, password):
    print(f"Attempting login for {username}...")
    try:
        response = requests.post(f"{BASE_URL}/token", data={
            "username": username,
            "password": password
        })
        
        if response.status_code == 200:
            token = response.json().get("access_token")
            print(f"Login successful. Token: {token[:10]}...")
            return token
        else:
            print(f"Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def test_dashboard_access(token):
    print("Attempting to access dashboard (users/me)...")
    try:
        response = requests.get(f"{BASE_URL}/users/me", headers={
            "Authorization": f"Bearer {token}"
        })
        
        if response.status_code == 200:
            print(f"Dashboard access successful. User: {response.json().get('username')}")
            return True
        else:
            print(f"Dashboard access failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Dashboard access error: {e}")
        return False

def test_tasks(token):
    print("Attempting to access tasks...")
    try:
        response = requests.get(f"{BASE_URL}/tasks/", headers={
            "Authorization": f"Bearer {token}"
        })
        
        if response.status_code == 200:
            print(f"Tasks access successful. Count: {len(response.json())}")
            return True
        else:
            print(f"Tasks access failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Tasks access error: {e}")
        return False

def test_analytics(token):
    print("Attempting to access analytics...")
    try:
        response = requests.get(f"{BASE_URL}/analytics/", headers={
            "Authorization": f"Bearer {token}"
        })
        
        if response.status_code == 200:
            print(f"Analytics access successful. Data keys: {list(response.json().keys())}")
            return True
        else:
            print(f"Analytics access failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Analytics access error: {e}")
        return False

if __name__ == "__main__":
    # You might need to adjust these credentials based on your seed data
    username = "testadmin" 
    password = "test123" 
    
    token = test_login(username, password)
    if token:
        if test_dashboard_access(token):
            test_tasks(token)
            test_analytics(token)
