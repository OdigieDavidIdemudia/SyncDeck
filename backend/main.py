from fastapi import FastAPI, Depends, HTTPException
import os
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from . import models, database
from . import auth as auth_utils # Import utility module with alias
from .routers import auth, users, teams, tasks, analytics, github

# Create database tables only in development
if os.getenv("APP_ENV", "development") == "development":
    models.Base.metadata.create_all(bind=database.engine)

import logging
# logging.basicConfig(level=logging.INFO)

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI(title="SyncDeck API")

# Ensure uploads directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount static files
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/debug/file/{filename}")
def debug_file(filename: str):
    path = os.path.join(UPLOAD_DIR, filename)
    exists = os.path.exists(path)
    return {
        "requested_filename": filename,
        "resolved_path": path,
        "exists_on_disk": exists,
        "upload_dir": UPLOAD_DIR,
        "cwd": os.getcwd()
    }

@app.on_event("startup")
async def startup_event():
    try:
        models.Base.metadata.create_all(bind=database.engine)
        print("Startup: Tables created (or already existed).")
        
        # Auto-seed testadmin
        db = database.SessionLocal()
        try:
            user = db.query(models.User).filter(models.User.username == "testadmin").first()
            if not user:
                print("Startup: Seeding testadmin user...")
                hashed_password = auth_utils.get_password_hash("test123")
                db_user = models.User(
                    username="testadmin", 
                    hashed_password=hashed_password,
                    role=models.UserRole.GROUP_HEAD
                )
                db.add(db_user)
                db.commit()
                print("Startup: testadmin created successfully.")
            else:
                # Ensure password is correct if user exists
                print("Startup: testadmin exists. Verifying password...")
                if not auth_utils.verify_password("test123", user.hashed_password):
                    print("Startup: Password mismatch for testadmin. Resetting to 'test123'...")
                    user.hashed_password = auth_utils.get_password_hash("test123")
                    db.commit()
                    print("Startup: Password reset.")
                else:
                    print("Startup: Password verified.")
        finally:
            db.close()
            
    except Exception as e:
        print(f"Startup Error: {e}")

@app.get("/debug/config")
def debug_config():
    import os
    return {
        "APP_ENV": os.getenv("APP_ENV"),
        "BASE_DIR": database.BASE_DIR,
        "DB_PATH": database.db_path,
        "DB_EXISTS": os.path.exists(database.db_path),
        "DB_URL": database.SQLALCHEMY_DATABASE_URL,
        "CWD": os.getcwd()
    }

# CORS

origins = [
    "http://localhost:5173", # Vite dev server
    "http://127.0.0.1:5173",
    os.getenv("FRONTEND_URL", ""),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin for origin in origins if origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




# Include Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(teams.router)
app.include_router(tasks.router)
app.include_router(analytics.router)
app.include_router(github.router)

# Health Check
@app.get("/")
@app.get("/health")
def health_check():
    return {"status": "ok", "environment": os.getenv("APP_ENV", "development")}

@app.get("/health/db")
def db_health_check(db: Session = Depends(database.get_db)):
    try:
        # Try to execute a simple query
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database connection failed: {str(e)}")

