"""
Database migration script to add progress_percentage column to tasks table.
"""
import sqlite3
import os

def migrate_database():
    db_path = 'task_tracker.db'
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if progress_percentage column exists in tasks table
        cursor.execute("PRAGMA table_info(tasks)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'progress_percentage' not in columns:
            print("Adding progress_percentage column to tasks table...")
            cursor.execute("ALTER TABLE tasks ADD COLUMN progress_percentage INTEGER DEFAULT 0")
            # Set default value for existing tasks
            cursor.execute("UPDATE tasks SET progress_percentage = 0 WHERE progress_percentage IS NULL")
            print("✓ Progress_percentage column added successfully")
        else:
            print("✓ Progress_percentage column already exists in tasks table")
        
        conn.commit()
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()
