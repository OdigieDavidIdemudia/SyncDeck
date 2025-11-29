"""
Database migration script to add member dashboard features.
Adds evidence_url to tasks and creates new tables.
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
        # 1. Add evidence_url to tasks
        print("Checking tasks table for evidence_url...")
        cursor.execute("PRAGMA table_info(tasks)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'evidence_url' not in columns:
            print("Adding evidence_url column to tasks table...")
            cursor.execute("ALTER TABLE tasks ADD COLUMN evidence_url VARCHAR")
            print("✓ evidence_url column added")
        else:
            print("✓ evidence_url column already exists")

        # 2. Create task_activities table
        print("\nCreating task_activities table...")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS task_activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER,
            user_id INTEGER,
            activity_type VARCHAR,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_id) REFERENCES tasks (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        """)
        print("✓ task_activities table created/verified")

        # 3. Create help_requests table
        print("\nCreating help_requests table...")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS help_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER,
            requester_id INTEGER,
            reason TEXT,
            status VARCHAR DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            resolved_at DATETIME,
            FOREIGN KEY (task_id) REFERENCES tasks (id),
            FOREIGN KEY (requester_id) REFERENCES users (id)
        )
        """)
        print("✓ help_requests table created/verified")

        # 4. Create member_achievements table
        print("\nCreating member_achievements table...")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS member_achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            on_time_completion_rate INTEGER DEFAULT 0,
            total_completed_tasks INTEGER DEFAULT 0,
            critical_tasks_completed INTEGER DEFAULT 0,
            current_no_blocker_streak INTEGER DEFAULT 0,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        """)
        print("✓ member_achievements table created/verified")
        
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
