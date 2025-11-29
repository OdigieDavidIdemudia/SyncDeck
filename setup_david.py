"""
Check for user 'David' and ensure test task is assigned to him.
"""
from backend.database import SessionLocal
from backend import models, auth
from datetime import datetime, timedelta

def check_and_setup_david():
    db = SessionLocal()
    try:
        # Check for 'David' (capitalized)
        david = db.query(models.User).filter(models.User.username == "David").first()
        
        if not david:
            print("User 'David' not found. Creating...")
            david = models.User(
                username="David",
                email="David@example.com",
                hashed_password=auth.get_password_hash("Password"),
                role=models.UserRole.MEMBER,
                is_active=True
            )
            db.add(david)
            db.commit()
            db.refresh(david)
            print("User 'David' created with password 'Password'.")
        else:
            print("User 'David' found.")
            # Update password to be sure
            david.hashed_password = auth.get_password_hash("Password")
            db.commit()
            print("Updated 'David' password to 'Password'.")

        # Ensure 'testadmin' exists (assigner)
        testadmin = db.query(models.User).filter(models.User.username == "testadmin").first()
        if not testadmin:
            print("User 'testadmin' not found! Creating...")
            testadmin = models.User(
                username="testadmin",
                email="testadmin@example.com",
                hashed_password=auth.get_password_hash("test123"),
                role=models.UserRole.GROUP_HEAD,
                is_active=True
            )
            db.add(testadmin)
            db.commit()
            db.refresh(testadmin)

        # Create/Update task assigned to David
        task_title = "Permission Test Task for David"
        task = db.query(models.Task).filter(
            models.Task.title == task_title,
            models.Task.assignee_id == david.id
        ).first()

        if not task:
            print(f"Creating task '{task_title}'...")
            task = models.Task(
                title=task_title,
                description="Task to test permission controls for David.",
                status=models.TaskStatus.ONGOING,
                criticality=models.TaskCriticality.MEDIUM,
                assigner_id=testadmin.id,
                assignee_id=david.id,
                deadline=datetime.utcnow() + timedelta(days=5),
                progress_percentage=0
            )
            db.add(task)
            db.commit()
            print(f"Task '{task_title}' created.")
        else:
            print(f"Task '{task_title}' already exists.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_and_setup_david()
