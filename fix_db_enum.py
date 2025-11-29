from sqlalchemy import text
from backend.database import SessionLocal

def fix_enum_values():
    db = SessionLocal()
    try:
        print("Inspecting current status values...")
        statuses = db.execute(text("SELECT DISTINCT status FROM tasks")).fetchall()
        print(f"Found statuses: {[repr(s[0]) for s in statuses]}")
        
        print("Updating invalid task statuses (handling case sensitivity)...")
        # Update both lowercase and uppercase variants just in case
        db.execute(text("UPDATE tasks SET status = 'ongoing' WHERE status = 'in_progress'"))
        db.execute(text("UPDATE tasks SET status = 'ongoing' WHERE status = 'IN_PROGRESS'"))
        db.execute(text("UPDATE tasks SET status = 'ongoing' WHERE status = 'TODO'"))
        db.commit()
        print("Successfully updated tasks.")
        
        # Verify again
        statuses_after = db.execute(text("SELECT DISTINCT status FROM tasks")).fetchall()
        print(f"Statuses after update: {statuses_after}")
        
    except Exception as e:
        print(f"Update failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_enum_values()
