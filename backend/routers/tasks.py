from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session, aliased
from sqlalchemy import or_, and_
from typing import List
from datetime import datetime
import shutil
import os
from pathlib import Path
from .. import models, schemas, auth, database, email_service

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"]
)

@router.post("/", response_model=schemas.Task)
def create_task(task: schemas.TaskCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    if current_user.role == models.UserRole.MEMBER:
         raise HTTPException(status_code=403, detail="Members cannot create tasks")
    
    if task.is_internal and current_user.role not in [models.UserRole.UNIT_HEAD, models.UserRole.BACKUP_UNIT_HEAD]:
         raise HTTPException(status_code=403, detail="Only Unit Heads (or Backups) can create internal tasks")

    # Extract assigned_to list and remove from dict
    task_dict = task.dict(exclude={'assigned_to'})
    assigned_to_ids = task.assigned_to or []
    
    # Set legacy assignee_id to first assignee for backward compatibility
    task_dict['assignee_id'] = assigned_to_ids[0] if assigned_to_ids else None
    task_dict['assigner_id'] = current_user.id
    
    db_task = models.Task(**task_dict)
    db.add(db_task)
    db.flush()  # Get task ID without committing
    
    # Create TaskAssignee entries for each assignee
    for user_id in assigned_to_ids:
        task_assignee = models.TaskAssignee(
            task_id=db_task.id,
            user_id=user_id
        )
        db.add(task_assignee)
    
    db.commit()
    db.refresh(db_task)
    
    # Send email notifications to all assignees
    try:
        assignee_users = db.query(models.User).filter(models.User.id.in_(assigned_to_ids)).all()
        for assignee in assignee_users:
            if assignee.email:
                email_service.send_task_assignment_email(
                    recipient_email=assignee.email,
                    recipient_name=assignee.username,
                    task_title=db_task.title,
                    task_description=db_task.description or "No description provided",
                    assigner_name=current_user.username,
                    deadline=db_task.deadline.strftime("%Y-%m-%d %H:%M") if db_task.deadline else None,
                    criticality=db_task.criticality.value if db_task.criticality else "medium"
                )
    except Exception as e:
        # Log error but don't fail task creation
        print(f"Failed to send email notification: {str(e)}")
    
    return db_task


@router.get("/", response_model=List[schemas.Task])
def read_tasks(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    # Query tasks based on user role
    if current_user.role == models.UserRole.GROUP_HEAD:
        # See all tasks EXCEPT internal ones (via task_assignees OR legacy assignee_id)
        Assignee = aliased(models.User)
        Assigner = aliased(models.User)

        tasks = db.query(models.Task)\
            .outerjoin(Assignee, models.Task.assignee_id == Assignee.id)\
            .outerjoin(Assigner, models.Task.assigner_id == Assigner.id)\
            .filter(
                models.Task.is_internal == False,
                or_(
                    Assignee.team_id != None,
                    and_(models.Task.assignee_id == None, Assigner.team_id != None),
                    models.Task.assigner_id == current_user.id,
                    # Also include tasks where current user is in task_assignees
                    models.Task.id.in_(
                        db.query(models.TaskAssignee.task_id).filter(
                            models.TaskAssignee.user_id.in_(
                                db.query(models.User.id).filter(models.User.team_id != None)
                            )
                        )
                    )
                )
            ).offset(skip).limit(limit).all()
    elif current_user.role in [models.UserRole.UNIT_HEAD, models.UserRole.BACKUP_UNIT_HEAD]:
        # See tasks assigned to members of their team (via task_assignees OR legacy assignee_id)
        if current_user.team_id:
            # Tasks where assignee is in their team OR task_assignees contains team member
            tasks = db.query(models.Task).filter(
                or_(
                    models.Task.assignee_id.in_(
                        db.query(models.User.id).filter(models.User.team_id == current_user.team_id)
                    ),
                    models.Task.id.in_(
                        db.query(models.TaskAssignee.task_id).filter(
                            models.TaskAssignee.user_id.in_(
                                db.query(models.User.id).filter(models.User.team_id == current_user.team_id)
                            )
                        )
                    )
                )
            ).offset(skip).limit(limit).all()
        else:
            # Fallback: tasks assigned to current user
            tasks = db.query(models.Task).filter(
                or_(
                    models.Task.assignee_id == current_user.id,
                    models.Task.id.in_(
                        db.query(models.TaskAssignee.task_id).filter(models.TaskAssignee.user_id == current_user.id)
                    )
                )
            ).offset(skip).limit(limit).all()
    else:
        # Member: See tasks assigned to them (via task_assignees OR legacy assignee_id)
        tasks = db.query(models.Task).filter(
            or_(
                models.Task.assignee_id == current_user.id,
                models.Task.id.in_(
                    db.query(models.TaskAssignee.task_id).filter(models.TaskAssignee.user_id == current_user.id)
                )
            )
        ).offset(skip).limit(limit).all()
    
    # Populate assignees list and is_new flag for each task
    for task in tasks:
        # Get all assignees from task_assignees table
        task_assignees = db.query(models.TaskAssignee).filter(models.TaskAssignee.task_id == task.id).all()
        assignee_ids = [ta.user_id for ta in task_assignees]
        task.assignees = db.query(models.User).filter(models.User.id.in_(assignee_ids)).all() if assignee_ids else []
        
        # Check if task is new for current user
        current_user_assignment = next((ta for ta in task_assignees if ta.user_id == current_user.id), None)
        task.is_new = current_user_assignment.viewed_at is None if current_user_assignment else False
    
    return tasks

@router.get("/{task_id}", response_model=schemas.Task)
def get_task(task_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    """Get a single task by ID"""
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Populate assignees list
    task_assignees = db.query(models.TaskAssignee).filter(models.TaskAssignee.task_id == task.id).all()
    assignee_ids = [ta.user_id for ta in task_assignees]
    task.assignees = db.query(models.User).filter(models.User.id.in_(assignee_ids)).all() if assignee_ids else []
    
    # Check if task is new for current user
    current_user_assignment = next((ta for ta in task_assignees if ta.user_id == current_user.id), None)
    task.is_new = current_user_assignment.viewed_at is None if current_user_assignment else False
    
    return task

@router.post("/{task_id}/mark-viewed")
def mark_task_viewed(task_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    """Mark a task as viewed by the current user"""
    task_assignee = db.query(models.TaskAssignee).filter(
        models.TaskAssignee.task_id == task_id,
        models.TaskAssignee.user_id == current_user.id
    ).first()
    
    if not task_assignee:
        raise HTTPException(status_code=404, detail="Task assignment not found")
    
    if task_assignee.viewed_at is None:
        task_assignee.viewed_at = datetime.utcnow()
        db.commit()
    
    return {"message": "Task marked as viewed"}

@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    """Delete a task. Only the assigner, unit heads, backup unit heads, or group head can delete tasks."""
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Permission check: Allow deletion if user is:
    # 1. The task assigner (creator)
    # 2. Unit Head or Backup Unit Head (for team tasks)
    # 3. Group Head (for all tasks)
    is_assigner = current_user.id == db_task.assigner_id
    is_unit_head = current_user.role in [models.UserRole.UNIT_HEAD, models.UserRole.BACKUP_UNIT_HEAD]
    is_group_head = current_user.role == models.UserRole.GROUP_HEAD
    
    if not (is_assigner or is_unit_head or is_group_head):
        raise HTTPException(status_code=403, detail="Not authorized to delete this task")
    
    # Log activity before deletion
    activity = models.TaskActivity(
        task_id=task_id,
        user_id=current_user.id,
        activity_type=models.ActivityType.STATUS_CHANGE,
        description=f"Task deleted by {current_user.username}"
    )
    db.add(activity)
    db.commit()
    
    # If task was completed, we need to update achievement stats
    if db_task.status == models.TaskStatus.COMPLETED and db_task.assignee_id:
        achievement = db.query(models.MemberAchievement).filter(models.MemberAchievement.user_id == db_task.assignee_id).first()
        if achievement:
            if achievement.total_completed_tasks > 0:
                achievement.total_completed_tasks -= 1
            if db_task.criticality == models.TaskCriticality.HIGH and achievement.critical_tasks_completed > 0:
                achievement.critical_tasks_completed -= 1
            db.add(achievement)

    # Delete the task
    db.delete(db_task)
    db.commit()
    
    return {"message": "Task deleted successfully", "task_id": task_id}

@router.put("/{task_id}", response_model=schemas.Task)
def update_task(task_id: int, task: schemas.TaskUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update fields
    task_data = task.dict(exclude_unset=True)
    
    # Track changes for activity log
    changes = []
    if 'status' in task_data and task_data['status'] != db_task.status:
        changes.append(f"Status changed from {db_task.status} to {task_data['status']}")
        # Log activity
        activity = models.TaskActivity(
            task_id=task_id,
            user_id=current_user.id,
            activity_type=models.ActivityType.STATUS_CHANGE,
            description=f"Status changed to {task_data['status'].replace('_', ' ').title()}"
        )
        db.add(activity)
        
    if 'progress_percentage' in task_data and task_data['progress_percentage'] != db_task.progress_percentage:
        # Log activity
        activity = models.TaskActivity(
            task_id=task_id,
            user_id=current_user.id,
            activity_type=models.ActivityType.PROGRESS_UPDATE,
            description=f"Progress updated to {task_data['progress_percentage']}%"
        )
        db.add(activity)

    for key, value in task_data.items():
        setattr(db_task, key, value)
    
    # Auto-set completed_at timestamp when status changes to COMPLETED
    if 'status' in task_data and task_data['status'] == models.TaskStatus.COMPLETED:
        if not db_task.completed_at:
            db_task.completed_at = datetime.utcnow()
            
            # Update member achievements
            achievement = db.query(models.MemberAchievement).filter(models.MemberAchievement.user_id == db_task.assignee_id).first()
            if not achievement:
                achievement = models.MemberAchievement(
                    user_id=db_task.assignee_id,
                    total_completed_tasks=0,
                    critical_tasks_completed=0,
                    on_time_completion_rate=0,
                    current_no_blocker_streak=0
                )
                db.add(achievement)
            
            # Ensure fields are not None before incrementing
            if achievement.total_completed_tasks is None:
                achievement.total_completed_tasks = 0
            if achievement.critical_tasks_completed is None:
                achievement.critical_tasks_completed = 0
                
            achievement.total_completed_tasks += 1
            if db_task.criticality == models.TaskCriticality.HIGH:
                achievement.critical_tasks_completed += 1
            achievement.last_updated = datetime.utcnow()
    
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.post("/{task_id}/comments/", response_model=schemas.Comment)
def create_comment(task_id: int, comment: schemas.CommentCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    db_comment = models.Comment(**comment.dict(), task_id=task_id, author_id=current_user.id)
    db.add(db_comment)
    
    # Log activity
    activity = models.TaskActivity(
        task_id=task_id,
        user_id=current_user.id,
        activity_type=models.ActivityType.COMMENT_ADDED,
        description="Added a comment"
    )
    db.add(activity)
    
    db.commit()
    db.refresh(db_comment)
    return db_comment

@router.get("/{task_id}/comments/", response_model=List[schemas.Comment])
def read_comments(task_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    comments = db.query(models.Comment).filter(models.Comment.task_id == task_id).order_by(models.Comment.created_at.desc()).all()
    return comments

@router.put("/{task_id}/comments/{comment_id}", response_model=schemas.Comment)
def update_comment(
    task_id: int, 
    comment_id: int, 
    comment_update: schemas.CommentUpdate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Edit a comment. Only the comment author can edit their own comments."""
    db_comment = db.query(models.Comment).filter(
        models.Comment.id == comment_id,
        models.Comment.task_id == task_id
    ).first()
    
    if not db_comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check if current user is the comment author
    if db_comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own comments")
    
    # Update the comment content
    db_comment.content = comment_update.content
    
    # Log activity
    activity = models.TaskActivity(
        task_id=task_id,
        user_id=current_user.id,
        activity_type=models.ActivityType.COMMENT_ADDED,
        description="Edited a comment"
    )
    db.add(activity)
    
    db.commit()
    db.refresh(db_comment)
    return db_comment

@router.delete("/{task_id}/comments/{comment_id}")
def delete_comment(
    task_id: int, 
    comment_id: int, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Delete a comment. Only the comment author can delete their own comments."""
    db_comment = db.query(models.Comment).filter(
        models.Comment.id == comment_id,
        models.Comment.task_id == task_id
    ).first()
    
    if not db_comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check if current user is the comment author
    if db_comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own comments")
    
    # Log activity before deletion
    activity = models.TaskActivity(
        task_id=task_id,
        user_id=current_user.id,
        activity_type=models.ActivityType.COMMENT_ADDED,
        description="Deleted a comment"
    )
    db.add(activity)
    
    # Delete the comment
    db.delete(db_comment)
    db.commit()
    
    return {"message": "Comment deleted successfully", "comment_id": comment_id}


@router.post("/{task_id}/help-request", response_model=schemas.HelpRequest)
def create_help_request(task_id: int, request: schemas.HelpRequestCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    help_req = models.HelpRequest(**request.dict(), task_id=task_id, requester_id=current_user.id)
    db.add(help_req)
    
    # Log activity
    activity = models.TaskActivity(
        task_id=task_id,
        user_id=current_user.id,
        activity_type=models.ActivityType.HELP_REQUESTED,
        description=f"Requested help: {request.reason}"
    )
    db.add(activity)
    
    db.commit()
    db.refresh(help_req)
    return help_req

@router.post("/{task_id}/evidence")
async def upload_evidence(
    task_id: int, 
    file: UploadFile = File(...), 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    # Create uploads directory if not exists (Use absolute path relative to project root)
    # Assuming this file is in backend/routers/ and uploads is in project root
    BASE_DIR = Path(__file__).resolve().parent.parent # routers -> backend
    UPLOAD_DIR = BASE_DIR / "uploads"
    
    if not UPLOAD_DIR.exists():
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"evidence_{task_id}_{datetime.utcnow().timestamp()}{file_extension}"
    file_path = UPLOAD_DIR / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Update task evidence_url
    evidence_url = f"/uploads/{filename}"
    db_task.evidence_url = evidence_url
    
    # Log activity
    activity = models.TaskActivity(
        task_id=task_id,
        user_id=current_user.id,
        activity_type=models.ActivityType.EVIDENCE_UPLOADED,
        description=f"Uploaded evidence: {file.filename}"
    )
    db.add(activity)
    
    db.commit()
    return {"filename": file.filename, "url": evidence_url}

@router.get("/{task_id}/timeline", response_model=List[schemas.TaskActivity])
def read_timeline(task_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    activities = db.query(models.TaskActivity).filter(models.TaskActivity.task_id == task_id).order_by(models.TaskActivity.created_at.desc()).all()
    return activities

@router.post("/{task_id}/update", response_model=schemas.Task)
def update_task_progress(
    task_id: int,
    update_data: schemas.TaskProgressUpdateCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Create TaskUpdate record
    task_update = models.TaskUpdate(
        task_id=task_id,
        user_id=current_user.id,
        summary_text=update_data.summary_text,
        progress_percentage=update_data.progress_percentage,
        status=update_data.status
    )
    db.add(task_update)

    # Update Task
    task.progress_percentage = update_data.progress_percentage
    task.status = update_data.status

    # Log Activity
    activity = models.TaskActivity(
        task_id=task_id,
        user_id=current_user.id,
        activity_type=models.ActivityType.PROGRESS_UPDATE,
        description=f"Updated progress to {update_data.progress_percentage}% and status to {update_data.status.replace('_', ' ').title()}. Summary: {update_data.summary_text or 'None'}"
    )
    db.add(activity)
    
    # Note: Completion and achievement updates now happen only via the approve endpoint

    db.commit()
    db.refresh(task)
    return task

@router.post("/{task_id}/approve", response_model=schemas.Task)
def approve_task(
    task_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Approve a task that is pending approval. Implements multi-level approval workflow."""
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if user has permission to approve
    if current_user.id != task.assigner_id and current_user.role not in [models.UserRole.UNIT_HEAD, models.UserRole.BACKUP_UNIT_HEAD, models.UserRole.GROUP_HEAD]:
        raise HTTPException(status_code=403, detail="Only the assigner or unit heads can approve tasks")
    
    # Check if task is pending approval (either status)
    if task.status not in [models.TaskStatus.PENDING_APPROVAL, models.TaskStatus.PENDING_GROUP_HEAD_APPROVAL, "pending_approval", "pending_group_head_approval"]:
        raise HTTPException(status_code=400, detail=f"Task is not pending approval. Current status: {task.status}")
    
    # Determine if this is the final approval based on the original assigner's role
    is_final_approval = False
    
    # If the task is already pending group head approval, only group head can give final approval
    if task.status == models.TaskStatus.PENDING_GROUP_HEAD_APPROVAL:
        if current_user.role == models.UserRole.GROUP_HEAD:
            is_final_approval = True
        else:
            raise HTTPException(status_code=403, detail="This task requires Group Head approval")
    else:
        # Task is in pending_approval status
        # Check who the original assigner was
        if task.assigner.role == models.UserRole.GROUP_HEAD:
            # Group head assigned it
            if current_user.role == models.UserRole.GROUP_HEAD:
                # Group head is approving their own task
                is_final_approval = True
            elif current_user.role in [models.UserRole.UNIT_HEAD, models.UserRole.BACKUP_UNIT_HEAD]:
                # Unit head is approving, but it needs to go to group head
                task.status = models.TaskStatus.PENDING_GROUP_HEAD_APPROVAL
                # Log Activity
                activity = models.TaskActivity(
                    task_id=task_id,
                    user_id=current_user.id,
                    activity_type=models.ActivityType.STATUS_CHANGE,
                    description=f"Task approved by {current_user.username}, forwarded to Group Head for final approval"
                )
                db.add(activity)
                db.commit()
                db.refresh(task)
                return task
        elif task.assigner.role in [models.UserRole.UNIT_HEAD, models.UserRole.BACKUP_UNIT_HEAD]:
            # Unit head assigned it, they or group head can give final approval
            if current_user.role in [models.UserRole.UNIT_HEAD, models.UserRole.BACKUP_UNIT_HEAD, models.UserRole.GROUP_HEAD]:
                is_final_approval = True
        else:
            # Member assigned it (shouldn't happen normally, but handle it)
            is_final_approval = True
    
    # If this is the final approval, mark as completed
    if is_final_approval:
        task.status = models.TaskStatus.COMPLETED
        task.completed_at = datetime.utcnow()
        
        # Update achievement stats for the assignee
        if task.assignee_id:
            stats = db.query(models.MemberAchievement).filter(models.MemberAchievement.user_id == task.assignee_id).first()
            if not stats:
                stats = models.MemberAchievement(
                    user_id=task.assignee_id,
                    total_completed_tasks=0,
                    critical_tasks_completed=0,
                    on_time_completion_rate=0,
                    current_no_blocker_streak=0
                )
                db.add(stats)
            
            # Ensure fields are not None before incrementing
            if stats.total_completed_tasks is None:
                stats.total_completed_tasks = 0
            if stats.critical_tasks_completed is None:
                stats.critical_tasks_completed = 0
                
            stats.total_completed_tasks += 1
            if task.criticality == models.TaskCriticality.HIGH:
                stats.critical_tasks_completed += 1
            stats.last_updated = datetime.utcnow()
        
        # Log Activity
        activity = models.TaskActivity(
            task_id=task_id,
            user_id=current_user.id,
            activity_type=models.ActivityType.STATUS_CHANGE,
            description=f"Task approved and marked as completed by {current_user.username}"
        )
        db.add(activity)
    
    db.commit()
    db.refresh(task)
    return task
