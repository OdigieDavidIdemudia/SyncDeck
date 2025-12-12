from backend.database import SessionLocal
from backend import models, auth

def create_test_user():
    db = SessionLocal()
    
    # Check if test user already exists
    user = db.query(models.User).filter(models.User.username == "testadmin").first()
    if user:
        print("User 'testadmin' already exists")
        db.close()
        return
    
    # Create new test user without MFA
    hashed_password = auth.get_password_hash("test123")
    user = models.User(
        username="testadmin",
        hashed_password=hashed_password,
        role=models.UserRole.GROUP_HEAD,
        mfa_secret=None  # No MFA
    )
    db.add(user)
    db.commit()
    print("✅ Test user created successfully!")
    print("   Username: testadmin")
    print("   Password: test123")
    print("   Role: GROUP_HEAD")
    print("   MFA: Disabled")
    db.close()

if __name__ == "__main__":
    create_test_user()
