"""
Database Migration Script for Task Criticality and Status Updates
This script migrates the database to add criticality and completed_at columns,
and updates existing task statuses to the new enum values.
"""

import sqlite3
from datetime import datetime

def migrate_database():
    conn = sqlite3.connect('task_tracker.db')
    cursor = conn.cursor()
    
    try:
        print("Starting database migration...")
        
        # Step 1: Add criticality column with default value 'medium'
        print("Adding criticality column...")
        try:
            cursor.execute("""
                ALTER TABLE tasks 
                ADD COLUMN criticality TEXT DEFAULT 'medium'
            """)
            print("✓ Criticality column added")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print("✓ Criticality column already exists")
            else:
                raise
        
        # Step 2: Add completed_at column (nullable)
        print("Adding completed_at column...")
        try:
            cursor.execute("""
                ALTER TABLE tasks 
                ADD COLUMN completed_at TIMESTAMP
            """)
            print("✓ Completed_at column added")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print("✓ Completed_at column already exists")
            else:
                raise
        
        # Step 3: Update existing task statuses
        print("Migrating task statuses...")
        
        # todo -> ongoing
        cursor.execute("""
            UPDATE tasks 
            SET status = 'ongoing' 
            WHERE status = 'todo'
        """)
        todo_count = cursor.rowcount
        print(f"✓ Migrated {todo_count} tasks from 'todo' to 'ongoing'")
        
        # in_progress -> ongoing
        cursor.execute("""
            UPDATE tasks 
            SET status = 'ongoing' 
            WHERE status = 'in_progress'
        """)
        in_progress_count = cursor.rowcount
        print(f"✓ Migrated {in_progress_count} tasks from 'in_progress' to 'ongoing'")
        
        # done -> completed
        cursor.execute("""
            UPDATE tasks 
            SET status = 'completed' 
            WHERE status = 'done'
        """)
        done_count = cursor.rowcount
        print(f"✓ Migrated {done_count} tasks from 'done' to 'completed'")
        
        # Step 4: Set completed_at for existing completed tasks
        print("Setting completion timestamps for completed tasks...")
        cursor.execute("""
            UPDATE tasks 
            SET completed_at = created_at 
            WHERE status = 'completed' AND completed_at IS NULL
        """)
        completed_count = cursor.rowcount
        print(f"✓ Set completion timestamp for {completed_count} completed tasks")
        
        # Commit all changes
        conn.commit()
        print("\n✅ Migration completed successfully!")
        
        # Display summary
        print("\n=== Migration Summary ===")
        print(f"Total tasks migrated: {todo_count + in_progress_count + done_count}")
        print(f"  - todo → ongoing: {todo_count}")
        print(f"  - in_progress → ongoing: {in_progress_count}")
        print(f"  - done → completed: {done_count}")
        print(f"Completion timestamps set: {completed_count}")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()
