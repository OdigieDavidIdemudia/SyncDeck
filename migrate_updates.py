from backend.database import engine, Base
from backend.models import TaskUpdate
import sqlalchemy

def migrate():
    print("Creating task_updates table...")
    TaskUpdate.__table__.create(bind=engine)
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
