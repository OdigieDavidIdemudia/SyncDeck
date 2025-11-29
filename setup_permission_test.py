"""
Setup script for permission testing.
Ensures user 'david' exists and has a task assigned by 'testadmin'.
"""
from backend.database import SessionLocal
from backend import models, auth
from datetime import datetime, timedelta

def setup_test_data():
    db = SessionLocal()
    try:
        # 1. Ensure 'david' exists
        david = db.query(models.User).filter(models.User.username == "david").first()
        if not david:
            print("Creating user 'david'...")
            david = models.User(
                username="david",
                email="david@example.com",
                hashed_password=auth.get_password_hash("david123"),
                role=models.UserRole.MEMBER,
                is_active=True
            )
            db.add(david)
            db.commit()
            db.refresh(david)
        else:
            print("User 'david' already exists.")

        # 2. Ensure 'testadmin' exists (assigner)
        testadmin = db.query(models.User).filter(models.User.username == "testadmin").first()
        if not testadmin:
            print("User 'testadmin' not found! Please create it first.")
            return

        # 3. Create a task assigned to david by testadmin
        task_title = "Permission Test Task"
        task = db.query(models.Task).filter(
            models.Task.title == task_title,
            models.Task.assignee_id == david.id
        ).first()

        if not task:
            print(f"Creating task '{task_title}'...")
            task = models.Task(
                title=task_title,
                description="Task to test permission controls. Assignee should NOT be able to edit metadata.",
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
            # Reset status if needed
            if task.status != models.TaskStatus.ONGOING:
                task.status = models.TaskStatus.ONGOING
                task.progress_percentage = 0
                db.commit()
                print("Task status reset to ONGOING.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    setup_test_data()
