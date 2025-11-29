"""
Database migration script to add email field to users table 
and deadline field to tasks table.
"""
import sqlite3
import os

def migrate_database():
    # Get the database path
    db_path = 'task_tracker.db'
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if email column exists in users table
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'email' not in columns:
            print("Adding email column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN email TEXT")
            print("✓ Email column added successfully")
        else:
            print("✓ Email column already exists in users table")
        
        # Check if deadline column exists in tasks table
        cursor.execute("PRAGMA table_info(tasks)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'deadline' not in columns:
            print("Adding deadline column to tasks table...")
            cursor.execute("ALTER TABLE tasks ADD COLUMN deadline DATETIME")
            print("✓ Deadline column added successfully")
            
            # If due_date exists, copy data
            if 'due_date' in columns:
                print("Copying data from due_date to deadline...")
                cursor.execute("UPDATE tasks SET deadline = due_date WHERE due_date IS NOT NULL")
                print("✓ Data copied successfully")
        else:
            print("✓ Deadline column already exists in tasks table")
        
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
