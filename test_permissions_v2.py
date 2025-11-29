"""
Test script to verify permission controls work correctly
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def login(username, password):
    """Login and return token"""
    try:
        response = requests.post(f"{BASE_URL}/token", data={
            "username": username,
            "password": password
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        print(f"Login failed for {username}: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Login error: {e}")
    return None

def get_user_info(token):
    """Get current user info"""
    response = requests.get(f"{BASE_URL}/users/me", headers={
        "Authorization": f"Bearer {token}"
    })
    if response.status_code == 200:
        return response.json()
    return None

def get_tasks(token):
    """Get all tasks"""
    response = requests.get(f"{BASE_URL}/tasks", headers={
        "Authorization": f"Bearer {token}"
    })
    if response.status_code == 200:
        return response.json()
    return []

# Test with different users
print("=" * 60)
print("PERMISSION CONTROLS TEST")
print("=" * 60)

# Test 1: Login as testadmin (group head)
print("\n1. Testing as testadmin (Group Head):")
token = login("testadmin", "test123")
if token:
    user = get_user_info(token)
    print(f"   Logged in as: {user['username']} (Role: {user['role']})")
    # Frontend Logic Simulation:
    # const canEditMetadata = user.role === 'group_head' || isAssigner;
    can_edit = user['role'] == 'group_head'
    print(f"   Frontend Logic Check: Role is group_head -> canEditMetadata = {can_edit}")
    print(f"   Expected Button: {'Edit Task' if can_edit else 'Update Progress'}")

# Test 2: Login as David (Member)
print("\n2. Testing as David (Member):")
token = login("David", "Password")
if token:
    user = get_user_info(token)
    print(f"   Logged in as: {user['username']} (Role: {user['role']})")
    tasks = get_tasks(token)
    
    # Find the test task
    target_task = None
    for t in tasks:
        if t['assignee_id'] == user['id'] and "Permission Test Task" in t['title']:
            target_task = t
            break
            
    if target_task:
        print(f"   Found Task: '{target_task['title']}'")
        is_assigner = target_task['assigner_id'] == user['id']
        
        # Frontend Logic Simulation:
        # const canEditMetadata = user.role === 'group_head' || isAssigner;
        can_edit = user['role'] == 'group_head' or is_assigner
        
        print(f"   Is Assigner: {is_assigner}")
        print(f"   Is Group Head: {user['role'] == 'group_head'}")
        print(f"   Frontend Logic Check: canEditMetadata = {can_edit}")
        print(f"   Expected Button: {'Edit Task' if can_edit else 'Update Progress'}")
        
        if not can_edit:
            print("   ✓ SUCCESS: David sees 'Update Progress' and cannot edit metadata")
        else:
            print("   ❌ FAILURE: David sees 'Edit Task'")
    else:
        print("   ❌ Task 'Permission Test Task' not found for David")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
