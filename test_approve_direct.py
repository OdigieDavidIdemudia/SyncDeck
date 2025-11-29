from backend.database import SessionLocal
from backend.models import Task, TaskStatus, MemberAchievement, TaskActivity, ActivityType
from datetime import datetime

db = SessionLocal()

try:
    # Get task
    task = db.query(Task).filter(Task.id == 1).first()
    if not task:
        print("✗ Task not found")
        exit(1)
    
    print(f"Task before: id={task.id}, status={task.status}, progress={task.progress_percentage}%")
    
    # Check status
    if task.status not in [TaskStatus.PENDING_APPROVAL, "pending_approval"]:
        print(f"✗ Task is not pending approval. Current status: {task.status}")
        exit(1)
    
    print("✓ Task is pending approval")
    
    # Approve the task
    task.status = TaskStatus.COMPLETED
    task.completed_at = datetime.utcnow()
    
    # Update achievement stats for assignee
    if task.assignee_id:
        stats = db.query(MemberAchievement).filter(MemberAchievement.user_id == task.assignee_id).first()
        if not stats:
            stats = MemberAchievement(user_id=task.assignee_id, total_completed_tasks=0, critical_tasks_completed=0, on_time_completion_rate=0, current_no_blocker_streak=0)
            db.add(stats)
        stats.total_completed_tasks += 1
        if task.criticality.value == 'high':
            stats.critical_tasks_completed += 1
        stats.last_updated = datetime.utcnow()
        print(f"✓ Updated achievement stats for user {task.assignee_id}")
    
    # Log activity
    activity = TaskActivity(
        task_id=task.id,
        user_id=1,  # Using user 1 for testing
        activity_type=ActivityType.STATUS_CHANGE,
        description=f"Task approved and marked as completed (via direct DB script)"
    )
    db.add(activity)
    
    db.commit()
    db.refresh(task)
    
    print(f"✓ Task approved successfully!")
    print(f"Task after: id={task.id}, status={task.status}, completed_at={task.completed_at}")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
