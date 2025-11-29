from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database import SessionLocal
from backend import models

def debug_query():
    db = SessionLocal()
    try:
        print("Testing status counts query...")
        status_counts = db.query(models.Task.status, func.count(models.Task.id)).group_by(models.Task.status).all()
        print(f"Status counts: {status_counts}")

        print("Testing team counts query...")
        # This is the suspicious query
        team_counts = db.query(models.Team.name, func.count(models.Task.id))\
            .join(models.User, models.Team.members)\
            .join(models.Task, models.User.assigned_tasks)\
            .group_by(models.Team.name).all()
        print(f"Team counts: {team_counts}")
        
    except Exception as e:
        print(f"Query failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_query()
