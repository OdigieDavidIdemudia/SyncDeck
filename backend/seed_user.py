from backend.database import SessionLocal, engine
from backend import models, auth

def seed():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    user = db.query(models.User).filter(models.User.username == "admin").first()
    if not user:
        hashed_password = auth.get_password_hash("admin")
        user = models.User(username="admin", hashed_password=hashed_password, role=models.UserRole.GROUP_HEAD)
        db.add(user)
        db.commit()
        print("User 'admin' created with password 'admin'")
    else:
        print("User 'admin' already exists")
    db.close()

if __name__ == "__main__":
    seed()
