from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, auth, database

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.post("/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    # Permission Check
    if current_user.role != models.UserRole.GROUP_HEAD:
        raise HTTPException(status_code=403, detail="Only Group Heads can create users")

    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        username=user.username, 
        hashed_password=hashed_password,
        role=user.role,
        team_id=user.team_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/", response_model=List[schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.get("/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role != models.UserRole.GROUP_HEAD:
        raise HTTPException(status_code=403, detail="Only Group Heads can delete users")

    db.delete(db_user)
    db.commit()
    return {"message": "User deleted"}

@router.put("/{user_id}", response_model=schemas.User)
def update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    # Authorization Logic
    is_self = current_user.id == user_id
    is_group_head = current_user.role == models.UserRole.GROUP_HEAD

    if not (is_self or is_group_head):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Handle Username Update
    if user_update.username and user_update.username != db_user.username:
        # Check if taken
        existing_user = db.query(models.User).filter(models.User.username == user_update.username).first()
        if existing_user:
             raise HTTPException(status_code=400, detail="Username already taken")
        db_user.username = user_update.username

    # Handle Password Update
    if user_update.password:
        db_user.hashed_password = auth.get_password_hash(user_update.password)

    # Handle Role/Team Update (Group Head Only)
    if is_group_head:
        if user_update.team_id is not None:
            db_user.team_id = user_update.team_id
        
        if user_update.role:
            if user_update.role == models.UserRole.UNIT_HEAD:
                # Check if team already has 2 unit heads
                target_team_id = user_update.team_id if user_update.team_id is not None else db_user.team_id
                
                if target_team_id:
                    unit_head_count = db.query(models.User).filter(
                        models.User.team_id == target_team_id,
                        models.User.role == models.UserRole.UNIT_HEAD
                    ).count()
                    
                    if db_user.role != models.UserRole.UNIT_HEAD and unit_head_count >= 2:
                         raise HTTPException(status_code=400, detail="Team already has maximum number of Unit Heads (2).")
            db_user.role = user_update.role
    elif (user_update.role or user_update.team_id is not None):
         # Non-admin trying to update role/team
         raise HTTPException(status_code=403, detail="Only Group Heads can update roles and teams")

    db.commit()
    db.refresh(db_user)
    return db_user
