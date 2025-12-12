from fastapi import FastAPI, Depends, HTTPException
import os
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from . import models, database
from .routers import auth, users, teams, tasks, analytics, github

# Create database tables only in development
if os.getenv("APP_ENV") == "development":
    models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="SyncDeck API", root_path="/api")

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

