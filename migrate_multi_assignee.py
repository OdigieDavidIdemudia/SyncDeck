"""
Database Migration: Add Multi-Assignee Support
This script creates the task_assignees junction table and migrates existing tasks.
"""
from sqlalchemy import create_engine, Column, Integer, ForeignKey, DateTime, Table, MetaData
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# Database setup
db_path = "syncdeck_v2.db"
if not os.path.exists(db_path):
    if os.path.exists("backend/syncdeck_v2.db"):
        db_path = "backend/syncdeck_v2.db"

DATABASE_URL = f"sqlite:///{db_path}"
engine = create_engine(DATABASE_URL)
metadata = MetaData()
Session = sessionmaker(bind=engine)
session = Session()

print(f"Using database: {db_path}")

try:
    # Create task_assignees table
    print("\n1. Creating task_assignees table...")
    session.execute("""
        CREATE TABLE IF NOT EXISTS task_assignees (
            task_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            viewed_at DATETIME,
            PRIMARY KEY (task_id, user_id),
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    session.commit()
    print("✓ task_assignees table created")
    
    # Migrate existing tasks with assignee_id to task_assignees
    print("\n2. Migrating existing task assignments...")
    result = session.execute("""
        SELECT id, assignee_id, created_at 
        FROM tasks 
        WHERE assignee_id IS NOT NULL
    """)
    tasks_to_migrate = result.fetchall()
    
    migrated_count = 0
    for task in tasks_to_migrate:
        task_id, assignee_id, created_at = task
        
        # Check if already migrated
        existing = session.execute("""
            SELECT 1 FROM task_assignees 
            WHERE task_id = ? AND user_id = ?
        """, (task_id, assignee_id)).fetchone()
        
        if not existing:
            session.execute("""
                INSERT INTO task_assignees (task_id, user_id, assigned_at, viewed_at)
                VALUES (?, ?, ?, ?)
            """, (task_id, assignee_id, created_at, created_at))  # Mark as viewed since it's existing
            migrated_count += 1
    
    session.commit()
    print(f"✓ Migrated {migrated_count} existing task assignments")
    
    print("\n✅ Migration completed successfully!")
    print("\nNext steps:")
    print("1. Restart the backend server to load the new models")
    print("2. Test creating a new task with multiple assignees")
    print("3. Verify existing tasks still display correctly")
    
except Exception as e:
    session.rollback()
    print(f"\n❌ Migration failed: {str(e)}")
    raise
finally:
    session.close()
