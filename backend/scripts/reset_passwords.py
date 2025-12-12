from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine
from backend import models, auth

def reset_passwords():
    db = SessionLocal()
    users = db.query(models.User).all()
    for user in users:
        print(f"Resetting password for {user.username}...")
        user.hashed_password = auth.get_password_hash("password")
    db.commit()
    print("All passwords reset to 'password'.")
    db.close()

if __name__ == "__main__":
    reset_passwords()
