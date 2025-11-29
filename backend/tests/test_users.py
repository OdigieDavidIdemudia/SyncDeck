def test_login_group_head(client):
    response = client.post(
        "/token",
        data={"username": "admin", "password": "password"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    return data["access_token"]

def test_create_unit_head(client):
    # First login as admin
    token = test_login_group_head(client)
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.post(
        "/users/",
        json={"username": "unit_head", "password": "password", "role": "unit_head"},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "unit_head"
    assert data["role"] == "unit_head"

def test_create_member(client):
    token = test_login_group_head(client)
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.post(
        "/users/",
        json={"username": "member", "password": "password", "role": "member"},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "member"
    assert data["role"] == "member"

def test_member_cannot_create_user(client):
    # Create member first
    token = test_login_group_head(client)
    headers = {"Authorization": f"Bearer {token}"}
    
    client.post(
        "/users/",
        json={"username": "member", "password": "password", "role": "member"},
        headers=headers
    )

    # Login as member
    response = client.post(
        "/token",
        data={"username": "member", "password": "password"},
    )
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.post(
        "/users/",
        json={"username": "hacker", "password": "password", "role": "group_head"},
        headers=headers
    )
    assert response.status_code == 403
