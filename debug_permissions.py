import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_login_and_permissions():
    print(f"Testing login to {BASE_URL}...")
    
    # 1. Test Login
    try:
        response = requests.post(f"{BASE_URL}/token", data={
            "username": "David",
            "password": "Password"
        })
        print(f"Login Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Login Response: {response.text}")
            return
            
        token = response.json()["access_token"]
        print("Login successful! Token received.")
        
        # 2. Get User Info
        user_response = requests.get(f"{BASE_URL}/users/me", headers={"Authorization": f"Bearer {token}"})
        user = user_response.json()
        print(f"User: {user['username']} (Role: {user['role']}, ID: {user['id']})")
        
        # 3. Get Tasks
        tasks_response = requests.get(f"{BASE_URL}/tasks", headers={"Authorization": f"Bearer {token}"})
        tasks = tasks_response.json()
        
        # 4. Check Permissions
        print("\nChecking Permissions for assigned tasks:")
        found = False
        for task in tasks:
            if task['assignee_id'] == user['id']:
                found = True
                print(f"\nTask: {task['title']}")
                print(f"  Assigner ID: {task['assigner_id']}")
                
                # Simulate Frontend Logic
                is_assigner = (task['assigner_id'] == user['id'])
                is_group_head = (user['role'] == 'group_head')
                
                # The FIXED logic:
                can_edit_metadata = is_group_head or is_assigner
                
                print(f"  Is Assigner: {is_assigner}")
                print(f"  Is Group Head: {is_group_head}")
                print(f"  Can Edit Metadata: {can_edit_metadata}")
                print(f"  Button Text Should Be: {'Edit Task' if can_edit_metadata else 'Update Progress'}")
                
                if not can_edit_metadata:
                    print("  ✓ CORRECT: User cannot edit metadata.")
                else:
                    print("  ❌ INCORRECT: User CAN edit metadata (unexpected for Member).")
                    
        if not found:
            print("\nNo tasks found assigned to David.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login_and_permissions()
