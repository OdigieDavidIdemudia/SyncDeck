from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine
from backend import models

def cleanup_unit_head():
    db = SessionLocal()
    
    # Find the unit_head user
    unit_head = db.query(models.User).filter(models.User.username == "unit_head").first()
    
    if unit_head:
        print(f"Found user 'unit_head' with ID {unit_head.id}. Deleting...")
        
        # Optional: Reassign tasks or just let them be deleted/orphaned depending on constraints
        # For this cleanup, we'll just delete the user. 
        # If there are foreign key constraints without cascade, this might fail, 
        # but let's try direct deletion first as it's a test user.
        try:
            db.delete(unit_head)
            db.commit()
            print("User 'unit_head' deleted successfully.")
        except Exception as e:
            print(f"Error deleting user: {e}")
            db.rollback()
    else:
        print("User 'unit_head' not found.")
    
    db.close()

if __name__ == "__main__":
    cleanup_unit_head()
