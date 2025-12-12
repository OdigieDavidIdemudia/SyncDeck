from sqlalchemy import create_engine, text
from backend.database import SQLALCHEMY_DATABASE_URL

def migrate():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN is_internal BOOLEAN DEFAULT 0"))
            print("Migration successful: Added is_internal column.")
        except Exception as e:
            print(f"Migration failed (maybe column exists): {e}")

if __name__ == "__main__":
    migrate()
