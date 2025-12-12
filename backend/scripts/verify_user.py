from sqlalchemy.orm import Session
from . import models, schemas, auth, database

def verify_user():
    db = database.SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == "testadmin").first()
        if user:
            print(f"User found: {user.username}")
            print(f"Role: {user.role}")
            print(f"Hashed Password: {user.hashed_password}")
            
            is_valid = auth.verify_password("test123", user.hashed_password)
            print(f"Password 'test123' valid: {is_valid}")
        else:
            print("User testadmin NOT found.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_user()
