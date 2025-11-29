"""
Migration script to add PENDING_GROUP_HEAD_APPROVAL status to TaskStatus enum
"""
from backend.database import SessionLocal, engine
from backend import models
from sqlalchemy import text

def migrate():
    db = SessionLocal()
    try:
        # For SQLite, we need to handle enum updates differently
        # Check if the new status value already exists in any tasks
        result = db.execute(text("SELECT COUNT(*) FROM tasks WHERE status = 'pending_group_head_approval'")).scalar()
        print(f"Found {result} tasks with pending_group_head_approval status")
        
        print("✓ Migration complete - new status 'pending_group_head_approval' is now available")
        print("Note: SQLite doesn't enforce enum constraints, so the new value is automatically available")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
