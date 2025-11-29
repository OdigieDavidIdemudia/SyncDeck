import requests

# Login first
login_resp = requests.post('http://127.0.0.1:8000/token', data={
    'username': 'testadmin',
    'password': 'test123'
})

if login_resp.status_code == 200:
    token = login_resp.json()['access_token']
    print(f"✓ Login successful")
    
    # Get all tasks
    tasks_resp = requests.get(
        'http://127.0.0.1:8000/tasks/',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    if tasks_resp.status_code == 200:
        tasks = tasks_resp.json()
        print(f"\n✓ Found {len(tasks)} tasks")
        
        # Find pending approval tasks
        pending_tasks = [t for t in tasks if t['status'] == 'pending_approval']
        print(f"✓ Found {len(pending_tasks)} tasks pending approval")
        
        if pending_tasks:
            task = pending_tasks[0]
            print(f"\nTesting approve on Task {task['id']}: {task['title']}")
            
            # Try to approve
            approve_resp = requests.post(
                f'http://127.0.0.1:8000/tasks/{task["id"]}/approve',
                headers={'Authorization': f'Bearer {token}'}
            )
            
            if approve_resp.status_code == 200:
                print(f"✓ Task approved successfully!")
                approved_task = approve_resp.json()
                print(f"  New status: {approved_task['status']}")
                print(f"  Completed at: {approved_task.get('completed_at', 'N/A')}")
            else:
                print(f"✗ Approve failed: {approve_resp.status_code}")
                print(f"  Response: {approve_resp.text}")
        else:
            print("\n⚠ No pending approval tasks found to test")
    else:
        print(f"✗ Failed to get tasks: {tasks_resp.status_code}")
else:
    print(f"✗ Login failed: {login_resp.status_code}")
