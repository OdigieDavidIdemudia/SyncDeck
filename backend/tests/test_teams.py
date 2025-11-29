from .test_users import test_login_group_head

def test_create_team(client):
    token = test_login_group_head(client)
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.post(
        "/teams/",
        json={"name": "Alpha Team"},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Alpha Team"
    return data["id"]

def test_assign_team_and_limit(client):
    token = test_login_group_head(client)
    headers = {"Authorization": f"Bearer {token}"}
    
    team_id = test_create_team(client)
    
    # Create 3 users
    for i in range(3):
        client.post(
            "/users/",
            json={"username": f"user_{i}", "password": "password", "role": "member"},
            headers=headers
        )
        
    # Get user IDs (assuming 2, 3, 4 etc. since admin is 1)
    # Actually, let's fetch them to be sure
    users = client.get("/users/", headers=headers).json()
    user_ids = [u["id"] for u in users if u["username"].startswith("user_")]
    
    # Promote 1st to UH of Team Alpha
    response = client.put(
        f"/users/{user_ids[0]}",
        json={"role": "unit_head", "team_id": team_id},
        headers=headers
    )
    assert response.status_code == 200
    
    # Promote 2nd to UH of Team Alpha
    response = client.put(
        f"/users/{user_ids[1]}",
        json={"role": "unit_head", "team_id": team_id},
        headers=headers
    )
    assert response.status_code == 200
    
    # Promote 3rd to UH of Team Alpha - SHOULD FAIL
    response = client.put(
        f"/users/{user_ids[2]}",
        json={"role": "unit_head", "team_id": team_id},
        headers=headers
    )
    assert response.status_code == 400
    assert "maximum" in response.json()["detail"]
