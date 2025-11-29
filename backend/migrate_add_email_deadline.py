"""
Database migration script to add email field to users table 
and rename due_date to deadline in tasks table.
"""
import sqlite3
import os

def migrate_database():
    # Get the database path
    db_path = os.path.join(os.path.dirname(__file__), 'tasks.db')
    
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
            print("Email column already exists in users table")
        
        # Check if deadline column exists in tasks table
        cursor.execute("PRAGMA table_info(tasks)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'due_date' in columns and 'deadline' not in columns:
            print("Renaming due_date to deadline in tasks table...")
            # SQLite doesn't support renaming columns directly, so we need to:
            # 1. Create new column
            # 2. Copy data
            # 3. Drop old column (requires recreating table)
            
            # For simplicity, just add deadline column and copy data
            cursor.execute("ALTER TABLE tasks ADD COLUMN deadline DATETIME")
            cursor.execute("UPDATE tasks SET deadline = due_date")
            print("✓ Deadline column added and data copied from due_date")
            print("Note: due_date column still exists but is no longer used")
        elif 'deadline' in columns:
            print("Deadline column already exists in tasks table")
        else:
            print("Adding deadline column to tasks table...")
            cursor.execute("ALTER TABLE tasks ADD COLUMN deadline DATETIME")
            print("✓ Deadline column added successfully")
        
        conn.commit()
        print("\n✓ Migration completed successfully!")
        
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()
