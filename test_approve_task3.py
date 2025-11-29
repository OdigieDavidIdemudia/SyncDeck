import requests

# Login first
login_resp = requests.post('http://127.0.0.1:8000/token', data={
    'username': 'testadmin',
    'password': 'test123'
})

if login_resp.status_code == 200:
    token = login_resp.json()['access_token']
    print(f"✓ Login successful, got token")
    
    # Try to approve task 3
    approve_resp = requests.post(
        'http://127.0.0.1:8000/tasks/3/approve',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    print(f"\nApprove Status: {approve_resp.status_code}")
    print(f"Response: {approve_resp.text}")
else:
    print(f"✗ Login failed: {login_resp.status_code}")
    print(f"Response: {login_resp.text}")
