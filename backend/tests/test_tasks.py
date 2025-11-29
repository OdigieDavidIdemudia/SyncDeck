from .test_users import test_login_group_head

def test_create_task_group_head(client):
    token = test_login_group_head(client)
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.post(
        "/tasks/",
        json={"title": "GH Task", "description": "Desc", "assignee_id": 1},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "GH Task"
    assert data["is_internal"] == False

def test_unit_head_internal_task(client):
    # Create Unit Head first
    token = test_login_group_head(client)
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create UH
    client.post(
        "/users/",
        json={"username": "uh_internal", "password": "password", "role": "unit_head"},
        headers=headers
    )
    
    # Login as UH
    response = client.post(
        "/token",
        data={"username": "uh_internal", "password": "password"},
    )
    uh_token = response.json()["access_token"]
    uh_headers = {"Authorization": f"Bearer {uh_token}"}
    
    # Create Internal Task
    response = client.post(
        "/tasks/",
        json={"title": "Internal Task", "description": "Secret", "is_internal": True},
        headers=uh_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_internal"] == True

def test_group_head_cannot_see_internal(client):
    token = test_login_group_head(client)
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get("/tasks/", headers=headers)
    assert response.status_code == 200
    tasks = response.json()
    # Should verify that "Internal Task" is NOT in the list
    for task in tasks:
        assert task["title"] != "Internal Task"
