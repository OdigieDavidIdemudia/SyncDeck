import requests

# Login first
login_resp = requests.post('http://127.0.0.1:8000/token', data={
    'username': 'testadmin',
    'password': 'test123'
})

if login_resp.status_code == 200:
    token = login_resp.json()['access_token']
    print(f"✓ Login successful")
    
    # Get user info to find assignee
    user_resp = requests.get(
        'http://127.0.0.1:8000/users/me',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    if user_resp.status_code == 200:
        user = user_resp.json()
        print(f"✓ User: {user['username']} (ID: {user['id']})")
        
        # Create a new task
        task_data = {
            'title': 'Test Approve Button',
            'description': 'This task is for testing the approve button functionality',
            'assignee_id': user['id'],
            'criticality': 'high',
            'is_internal': False,
            'deadline': None
        }
        
        create_resp = requests.post(
            'http://127.0.0.1:8000/tasks/',
            json=task_data,
            headers={'Authorization': f'Bearer {token}'}
        )
        
        if create_resp.status_code == 200:
            task = create_resp.json()
            print(f"✓ Created task {task['id']}: {task['title']}")
            
            # Update task to pending_approval status
            update_data = {
                'progress_percentage': 100,
                'status': 'pending_approval',
                'summary_text': 'Task completed and ready for approval'
            }
            
            update_resp = requests.post(
                f'http://127.0.0.1:8000/tasks/{task["id"]}/update',
                json=update_data,
                headers={'Authorization': f'Bearer {token}'}
            )
            
            if update_resp.status_code == 200:
                print(f"✓ Updated task to pending_approval status")
                print(f"\n✅ Task {task['id']} is ready for testing the approve button!")
                print(f"   You can now test the approve button in the frontend.")
            else:
                print(f"✗ Failed to update task: {update_resp.status_code}")
                print(f"  Response: {update_resp.text}")
        else:
            print(f"✗ Failed to create task: {create_resp.status_code}")
            print(f"  Response: {create_resp.text}")
    else:
        print(f"✗ Failed to get user info: {user_resp.status_code}")
else:
    print(f"✗ Login failed: {login_resp.status_code}")
