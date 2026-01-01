from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os

# Adjust path to where the DB is relative to this script
# Assuming script runs in project root, DB is likely in project root or backend
db_path = "syncdeck_v2.db"
if not os.path.exists(db_path):
    print(f"DB not found at {db_path}, trying other locations...")
    if os.path.exists("backend/syncdeck_v2.db"):
        db_path = "backend/syncdeck_v2.db"

print(f"Using DB: {db_path}")

DATABASE_URL = f"sqlite:///{db_path}"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    # Get tasks with evidence, ordered by most recently updated/created
    result = db.execute(text("SELECT id, title, evidence_url, created_at FROM tasks WHERE evidence_url IS NOT NULL ORDER BY id DESC LIMIT 5"))
    tasks = result.fetchall()
    
    print("\nRecent Tasks with Evidence:")
    for t in tasks:
        print(f"ID: {t.id}, Title: {t.title}, URL: {t.evidence_url}")
        
    # Also check if the file exists on disk for the first one
    if tasks:
        url = tasks[0].evidence_url
        if url:
            # url format expected: /uploads/filename
            fname = url.replace("/uploads/", "").replace("/static/", "")
            
            # Check backend/uploads
            backend_path = os.path.join("backend", "uploads", fname)
            root_path = os.path.join("uploads", fname)
            
            print(f"\nChecking file: {fname}")
            print(f"backend/uploads exists? {os.path.exists(backend_path)}")
            print(f"root/uploads exists? {os.path.exists(root_path)}")

finally:
    db.close()
