from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError as integrity_error
from typing import List, Optional
from datetime import datetime
from .. import models, schemas, auth, database

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.post("/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        # Permission Check and team_id assignment
        if current_user.role == models.UserRole.GROUP_HEAD:
            # GROUP_HEAD can create any role
            pass
        elif current_user.role in [models.UserRole.UNIT_HEAD, models.UserRole.BACKUP_UNIT_HEAD]:
            # UNIT_HEAD can only create MEMBER in their own team
            if user.role != models.UserRole.MEMBER:
                raise HTTPException(status_code=403, detail="Unit Heads can only create Members")
            # Automatically assign to UNIT_HEAD's team if not specified
            if not user.team_id:
                user.team_id = current_user.team_id
            elif user.team_id != current_user.team_id:
                raise HTTPException(status_code=403, detail="Unit Heads can only create Members in their own team")
        else:
            raise HTTPException(status_code=403, detail="Insufficient permissions to create users")

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
    except integrity_error:
        db.rollback()
        raise HTTPException(status_code=400, detail="User creation failed. Username or Email may already exist, or invalid Team ID.")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.get("/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    """Delete a user. Only GROUP_HEAD can delete, and only if there's an approved deletion request or direct deletion."""
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role != models.UserRole.GROUP_HEAD:
        raise HTTPException(status_code=403, detail="Only Group Heads can delete users")

    # Check if there's an approved deletion request
    deletion_request = db.query(models.UserDeletionRequest).filter(
        models.UserDeletionRequest.user_id == user_id,
        models.UserDeletionRequest.status == models.DeletionRequestStatus.APPROVED
    ).first()
    
    # Delete the user
    db.delete(db_user)
    
    # If there was a deletion request, mark it as completed
    if deletion_request:
        db.delete(deletion_request)
    
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
        update_data = user_update.dict(exclude_unset=True)
        
        if "team_id" in update_data:
            db_user.team_id = update_data["team_id"]
        
        if "role" in update_data:
            new_role = update_data["role"]
            
            # Enforce one UNIT_HEAD per team
            if new_role == models.UserRole.UNIT_HEAD and db_user.team_id:
                existing_unit_head = db.query(models.User).filter(
                    models.User.team_id == db_user.team_id,
                    models.User.role == models.UserRole.UNIT_HEAD,
                    models.User.id != db_user.id
                ).first()
                if existing_unit_head:
                    raise HTTPException(status_code=400, detail=f"Team already has a Unit Head: {existing_unit_head.username}")
            
            # Enforce one BACKUP_UNIT_HEAD per team
            if new_role == models.UserRole.BACKUP_UNIT_HEAD and db_user.team_id:
                existing_backup = db.query(models.User).filter(
                    models.User.team_id == db_user.team_id,
                    models.User.role == models.UserRole.BACKUP_UNIT_HEAD,
                    models.User.id != db_user.id
                ).first()
                if existing_backup:
                    raise HTTPException(status_code=400, detail=f"Team already has a Backup Unit Head: {existing_backup.username}")
            
            db_user.role = new_role
    
    db.commit()
    db.refresh(db_user)
    return db_user


# User Deletion Request Endpoints

@router.post("/deletion-requests/", response_model=schemas.UserDeletionRequest)
def request_user_deletion(
    request: schemas.UserDeletionRequestCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """UNIT_HEAD requests deletion of a MEMBER in their team"""
    # Only UNIT_HEAD or BACKUP_UNIT_HEAD can request
    if current_user.role not in [models.UserRole.UNIT_HEAD, models.UserRole.BACKUP_UNIT_HEAD]:
        raise HTTPException(status_code=403, detail="Only Unit Heads can request user deletion")
    
    # Get the user to be deleted
    user_to_delete = db.query(models.User).filter(models.User.id == request.user_id).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Can only request deletion of MEMBER in their own team
    if user_to_delete.role != models.UserRole.MEMBER:
        raise HTTPException(status_code=403, detail="Can only request deletion of Members")
    
    if user_to_delete.team_id != current_user.team_id:
        raise HTTPException(status_code=403, detail="Can only request deletion of Members in your own team")
    
    # Check if there's already a pending request for this user
    existing_request = db.query(models.UserDeletionRequest).filter(
        models.UserDeletionRequest.user_id == request.user_id,
        models.UserDeletionRequest.status == models.DeletionRequestStatus.PENDING
    ).first()
    
    if existing_request:
        raise HTTPException(status_code=400, detail="There is already a pending deletion request for this user")
    
    # Create the deletion request
    deletion_request = models.UserDeletionRequest(
        user_id=request.user_id,
        requested_by_id=current_user.id,
        reason=request.reason
    )
    db.add(deletion_request)
    db.commit()
    db.refresh(deletion_request)
    return deletion_request

@router.get("/deletion-requests/", response_model=List[schemas.UserDeletionRequest])
def get_deletion_requests(
    status: Optional[str] = "pending",
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """GROUP_HEAD views deletion requests"""
    if current_user.role != models.UserRole.GROUP_HEAD:
        raise HTTPException(status_code=403, detail="Only Group Heads can view deletion requests")
    
    query = db.query(models.UserDeletionRequest)
    
    if status:
        query = query.filter(models.UserDeletionRequest.status == status)
    
    requests = query.order_by(models.UserDeletionRequest.created_at.desc()).all()
    return requests

@router.post("/deletion-requests/{request_id}/review")
def review_deletion_request(
    request_id: int,
    approved: bool,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """GROUP_HEAD approves or rejects a deletion request"""
    if current_user.role != models.UserRole.GROUP_HEAD:
        raise HTTPException(status_code=403, detail="Only Group Heads can review deletion requests")
    
    deletion_request = db.query(models.UserDeletionRequest).filter(
        models.UserDeletionRequest.id == request_id
    ).first()
    
    if not deletion_request:
        raise HTTPException(status_code=404, detail="Deletion request not found")
    
    if deletion_request.status != models.DeletionRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="This request has already been reviewed")
    
    # Update the request status
    deletion_request.status = models.DeletionRequestStatus.APPROVED if approved else models.DeletionRequestStatus.REJECTED
    deletion_request.reviewed_at = datetime.utcnow()
    deletion_request.reviewed_by_id = current_user.id
    
    # If approved, delete the user
    if approved:
        user_to_delete = db.query(models.User).filter(models.User.id == deletion_request.user_id).first()
        if user_to_delete:
            db.delete(user_to_delete)
    
    db.commit()
    db.refresh(deletion_request)
    
    return {
        "message": f"Deletion request {'approved' if approved else 'rejected'}",
        "request": deletion_request
    }


# Promotion Request Endpoints

@router.post("/promotion-requests/", response_model=schemas.PromotionRequest)
def request_promotion(
    request: schemas.PromotionRequestCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """UNIT_HEAD requests promotion of a MEMBER to BACKUP_UNIT_HEAD"""
    # Only UNIT_HEAD can request
    if current_user.role != models.UserRole.UNIT_HEAD:
        raise HTTPException(status_code=403, detail="Only Unit Heads can request promotions")
    
    # Get the user to be promoted
    user_to_promote = db.query(models.User).filter(models.User.id == request.user_id).first()
    if not user_to_promote:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Can only promote MEMBER in their own team
    if user_to_promote.role != models.UserRole.MEMBER:
        raise HTTPException(status_code=403, detail="Can only promote Members")
    
    if user_to_promote.team_id != current_user.team_id:
        raise HTTPException(status_code=403, detail="Can only promote Members in your own team")
    
    # Only allow promotion to BACKUP_UNIT_HEAD
    if request.target_role != "backup_unit_head":
        raise HTTPException(status_code=400, detail="Can only promote to Backup Unit Head role")
    
    # Check if there's already a BACKUP_UNIT_HEAD in the team
    existing_backup = db.query(models.User).filter(
        models.User.team_id == current_user.team_id,
        models.User.role == models.UserRole.BACKUP_UNIT_HEAD
    ).first()
    if existing_backup:
        raise HTTPException(status_code=400, detail=f"Team already has a Backup Unit Head: {existing_backup.username}")
    
    # Check if there's already a pending request for this user
    existing_request = db.query(models.PromotionRequest).filter(
        models.PromotionRequest.user_id == request.user_id,
        models.PromotionRequest.status == models.PromotionRequestStatus.PENDING
    ).first()
    
    if existing_request:
        raise HTTPException(status_code=400, detail="There is already a pending promotion request for this user")
    
    # Create the promotion request
    promotion_request = models.PromotionRequest(
        user_id=request.user_id,
        requested_by_id=current_user.id,
        target_role=models.UserRole.BACKUP_UNIT_HEAD,
        reason=request.reason
    )
    db.add(promotion_request)
    db.commit()
    db.refresh(promotion_request)
    return promotion_request

@router.get("/promotion-requests/", response_model=List[schemas.PromotionRequest])
def get_promotion_requests(
    status: Optional[str] = "pending",
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """GROUP_HEAD views promotion requests"""
    if current_user.role != models.UserRole.GROUP_HEAD:
        raise HTTPException(status_code=403, detail="Only Group Heads can view promotion requests")
    
    query = db.query(models.PromotionRequest)
    
    if status:
        query = query.filter(models.PromotionRequest.status == status)
    
    requests = query.order_by(models.PromotionRequest.created_at.desc()).all()
    return requests

@router.post("/promotion-requests/{request_id}/review")
def review_promotion_request(
    request_id: int,
    approved: bool,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """GROUP_HEAD approves or rejects a promotion request"""
    if current_user.role != models.UserRole.GROUP_HEAD:
        raise HTTPException(status_code=403, detail="Only Group Heads can review promotion requests")
    
    promotion_request = db.query(models.PromotionRequest).filter(
        models.PromotionRequest.id == request_id
    ).first()
    
    if not promotion_request:
        raise HTTPException(status_code=404, detail="Promotion request not found")
    
    if promotion_request.status != models.PromotionRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="This request has already been reviewed")
    
    # Update the request status
    promotion_request.status = models.PromotionRequestStatus.APPROVED if approved else models.PromotionRequestStatus.REJECTED
    promotion_request.reviewed_at = datetime.utcnow()
    promotion_request.reviewed_by_id = current_user.id
    
    # If approved, promote the user
    if approved:
        user_to_promote = db.query(models.User).filter(models.User.id == promotion_request.user_id).first()
        if user_to_promote:
            # Double-check there's no existing BACKUP_UNIT_HEAD
            existing_backup = db.query(models.User).filter(
                models.User.team_id == user_to_promote.team_id,
                models.User.role == models.UserRole.BACKUP_UNIT_HEAD,
                models.User.id != user_to_promote.id
            ).first()
            if existing_backup:
                raise HTTPException(status_code=400, detail=f"Team already has a Backup Unit Head: {existing_backup.username}")
            
            user_to_promote.role = promotion_request.target_role
    
    db.commit()
    db.refresh(promotion_request)
    
    return {
        "message": f"Promotion request {'approved' if approved else 'rejected'}",
        "request": promotion_request
    }

@router.post("/demote/{user_id}")
def demote_backup_unit_head(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """UNIT_HEAD demotes BACKUP_UNIT_HEAD to MEMBER"""
    if current_user.role != models.UserRole.UNIT_HEAD:
        raise HTTPException(status_code=403, detail="Only Unit Heads can demote Backup Unit Heads")
    
    user_to_demote = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_demote:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Can only demote BACKUP_UNIT_HEAD in their own team
    if user_to_demote.role != models.UserRole.BACKUP_UNIT_HEAD:
        raise HTTPException(status_code=400, detail="Can only demote Backup Unit Heads")
    
    if user_to_demote.team_id != current_user.team_id:
        raise HTTPException(status_code=403, detail="Can only demote Backup Unit Heads in your own team")
    
    # Demote to MEMBER
    user_to_demote.role = models.UserRole.MEMBER
    db.commit()
    db.refresh(user_to_demote)
    
    return {
        "message": f"User {user_to_demote.username} demoted to Member",
        "user": user_to_demote
    }
