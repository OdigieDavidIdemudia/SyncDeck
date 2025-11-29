from backend.database import SessionLocal
from backend import models, auth

def verify_pass():
    db = SessionLocal()
    user = db.query(models.User).filter(models.User.username == "admin").first()
    if user:
        print(f"User found: {user.username}")
        is_valid = auth.verify_password("admin", user.hashed_password)
        print(f"Password 'admin' valid: {is_valid}")
        
        # Debug hash
        print(f"Hash: {user.hashed_password}")
        
        # Test hashing again
        new_hash = auth.get_password_hash("admin")
        print(f"New hash for 'admin': {new_hash}")
        print(f"Verify new hash: {auth.verify_password('admin', new_hash)}")
    else:
        print("User not found")
    db.close()

if __name__ == "__main__":
    verify_pass()
