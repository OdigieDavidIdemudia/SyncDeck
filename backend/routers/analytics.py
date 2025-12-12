from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
import io
from .. import models, schemas, auth, database
from ..export_utils import generate_csv, generate_pdf

router = APIRouter(
    tags=["analytics"]
)

@router.get("/users/{user_id}/achievement-stats", response_model=schemas.MemberAchievement)
def get_achievement_stats(user_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    stats = db.query(models.MemberAchievement).filter(models.MemberAchievement.user_id == user_id).first()
    
    # Self-healing: Recalculate counts to ensure consistency
    actual_completed = db.query(models.Task).filter(
        models.Task.assignee_id == user_id, 
        models.Task.status == models.TaskStatus.COMPLETED
    ).count()
    
    actual_critical = db.query(models.Task).filter(
        models.Task.assignee_id == user_id, 
        models.Task.status == models.TaskStatus.COMPLETED,
        models.Task.criticality == models.TaskCriticality.HIGH
    ).count()
    
    if not stats:
        stats = models.MemberAchievement(
            user_id=user_id, 
            on_time_completion_rate=0,
            total_completed_tasks=actual_completed,
            critical_tasks_completed=actual_critical,
            current_no_blocker_streak=0,
            last_updated=datetime.utcnow()
        )
        db.add(stats)
        db.commit()
        db.refresh(stats)
    else:
        # Update if mismatch found
        if stats.total_completed_tasks != actual_completed or stats.critical_tasks_completed != actual_critical:
            stats.total_completed_tasks = actual_completed
            stats.critical_tasks_completed = actual_critical
            db.commit()
            db.refresh(stats)
            
    return stats

@router.get("/achievements/{user_id}")
def get_achievements(
    user_id: int,
    period: str = "month",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Get completed tasks (achievements) for a user with optional filtering"""
    # Authorization: users can view their own achievements, unit heads can view team members, group heads can view all
    if current_user.id != user_id:
        if current_user.role == models.UserRole.UNIT_HEAD:
            # Check if user is in the same team
            target_user = db.query(models.User).filter(models.User.id == user_id).first()
            if not target_user or target_user.team_id != current_user.team_id:
                raise HTTPException(status_code=403, detail="Not authorized to view this user's achievements")
        elif current_user.role != models.UserRole.GROUP_HEAD:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    # Base query for completed tasks with eager loading
    query = db.query(models.Task).options(
        joinedload(models.Task.assigner),
        joinedload(models.Task.updates)
    ).filter(
        models.Task.assignee_id == user_id,
        models.Task.status == models.TaskStatus.COMPLETED
    )
    
    # Apply date filtering
    if period == "week":
        start = datetime.now() - timedelta(days=7)
        query = query.filter(models.Task.completed_at >= start)
    elif period == "month":
        start = datetime.now() - timedelta(days=30)
        query = query.filter(models.Task.completed_at >= start)
    elif start_date and end_date:
        try:
            start = datetime.fromisoformat(start_date)
            end = datetime.fromisoformat(end_date)
            query = query.filter(models.Task.completed_at >= start, models.Task.completed_at <= end)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")
    
    tasks = query.order_by(models.Task.completed_at.desc()).all()
    return tasks

@router.get("/achievements/{user_id}/export")
def export_achievements(
    user_id: int,
    format: str = "csv",
    period: str = "month",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Export achievements as CSV or PDF"""
    # Same authorization as get_achievements
    if current_user.id != user_id:
        if current_user.role == models.UserRole.UNIT_HEAD:
            target_user = db.query(models.User).filter(models.User.id == user_id).first()
            if not target_user or target_user.team_id != current_user.team_id:
                raise HTTPException(status_code=403, detail="Not authorized")
        elif current_user.role != models.UserRole.GROUP_HEAD:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get user info
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Base query
    query = db.query(models.Task).filter(
        models.Task.assignee_id == user_id,
        models.Task.status == models.TaskStatus.COMPLETED
    )
    
    # Apply date filtering
    if period == "week":
        start = datetime.now() - timedelta(days=7)
        query = query.filter(models.Task.completed_at >= start)
    elif period == "month":
        start = datetime.now() - timedelta(days=30)
        query = query.filter(models.Task.completed_at >= start)
    elif start_date and end_date:
        try:
            start = datetime.fromisoformat(start_date)
            end = datetime.fromisoformat(end_date)
            query = query.filter(models.Task.completed_at >= start, models.Task.completed_at <= end)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")
    
    tasks = query.order_by(models.Task.completed_at.desc()).all()
    
    # Convert to dict for export functions
    tasks_data = []
    for task in tasks:
        tasks_data.append({
            'title': task.title,
            'description': task.description,
            'completed_at': task.completed_at.isoformat() if task.completed_at else None,
            'criticality': task.criticality.value if task.criticality else 'medium',
            'assigner': {'username': task.assigner.username if task.assigner else 'N/A'}
        })
    
    if format == "csv":
        csv_content = generate_csv(tasks_data, user.username)
        return StreamingResponse(
            io.StringIO(csv_content),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=achievements_{user.username}_{period}.csv"}
        )
    elif format == "pdf":
        pdf_content = generate_pdf(tasks_data, user.username, period)
        return StreamingResponse(
            io.BytesIO(pdf_content),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=achievements_{user.username}_{period}.pdf"}
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid format. Use 'csv' or 'pdf'")

@router.get("/analytics/")
def get_analytics(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    if current_user.role != models.UserRole.GROUP_HEAD:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Global Stats
    total_tasks = db.query(models.Task).count()
    completed_tasks = db.query(models.Task).filter(models.Task.status == models.TaskStatus.COMPLETED).count()
    pending_tasks = total_tasks - completed_tasks
    
    # Team Data
    teams = db.query(models.Team).all()
    team_data = []
    
    for team in teams:
        members = db.query(models.User).filter(models.User.team_id == team.id).all()
        member_ids = [m.id for m in members]
        
        if not member_ids:
            team_tasks_count = 0
            team_completed_count = 0
        else:
            team_tasks_count = db.query(models.Task).filter(models.Task.assignee_id.in_(member_ids)).count()
            team_completed_count = db.query(models.Task).filter(models.Task.assignee_id.in_(member_ids), models.Task.status == models.TaskStatus.COMPLETED).count()
        
        team_data.append({
            "name": team.name,
            "tasks": team_tasks_count,
            "completed": team_completed_count
        })

    # Status Data
    status_counts = db.query(models.Task.status, func.count(models.Task.status)).group_by(models.Task.status).all()
    status_data = [{"name": status.value, "value": count} for status, count in status_counts]
    
    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
        "team_data": team_data,
        "status_data": status_data
    }
