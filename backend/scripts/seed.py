from sqlalchemy.orm import Session
from backend import models, schemas, auth, database

def seed_db():
    models.Base.metadata.create_all(bind=database.engine)
    db = database.SessionLocal()
    try:
        # Check if testadmin exists
        user = db.query(models.User).filter(models.User.username == "testadmin").first()
        if not user:
            print("Creating testadmin user...")
            hashed_password = auth.get_password_hash("test123")
            db_user = models.User(
                username="testadmin", 
                hashed_password=hashed_password,
                role=models.UserRole.GROUP_HEAD
            )
            db.add(db_user)
            db.commit()
            print("testadmin created.")
        else:
            print("testadmin already exists.")
            
    except Exception as e:
        print(f"Error seeding DB: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
