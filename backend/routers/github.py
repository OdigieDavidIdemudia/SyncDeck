from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, auth, database
import httpx
import os

router = APIRouter(
    prefix="/github",
    tags=["github"],
    responses={404: {"description": "Not found"}},
)

# These should be in environment variables
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

@router.get("/login")
def github_login():
    return {
        "url": f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&scope=repo"
    }

@router.post("/callback")
async def github_callback(code: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
            },
        )
        
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to retrieve access token")
        
    data = response.json()
    access_token = data.get("access_token")
    
    if not access_token:
        raise HTTPException(status_code=400, detail="Invalid code or credentials")
        
    # Store token
    current_user.github_token = access_token
    db.commit()
    
    return {"message": "GitHub connected successfully"}

@router.post("/push")
async def github_push(
    repo_name: str, 
    commit_message: str, 
    file_path: str, 
    content: str, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_active_user)
):
    if not current_user.github_token:
        raise HTTPException(status_code=400, detail="GitHub not connected")
        
    # This is a simplified example. In reality, you'd need to handle branches, SHAs for updates, etc.
    # Here we assume creating a new file or updating if we had the SHA.
    # For simplicity, let's try to create a file.
    
    url = f"https://api.github.com/repos/{current_user.username}/{repo_name}/contents/{file_path}"
    
    headers = {
        "Authorization": f"token {current_user.github_token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    import base64
    content_encoded = base64.b64encode(content.encode()).decode()
    
    data = {
        "message": commit_message,
        "content": content_encoded
    }
    
    async with httpx.AsyncClient() as client:
        # Check if file exists to get SHA (for update)
        get_res = await client.get(url, headers=headers)
        if get_res.status_code == 200:
            data["sha"] = get_res.json()["sha"]
            
        response = await client.put(url, headers=headers, json=data)
        
    if response.status_code not in [200, 201]:
        raise HTTPException(status_code=response.status_code, detail=response.text)
        
    return response.json()
