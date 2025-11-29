from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
import pytest
from backend.main import app
from backend.database import Base, get_db

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

from backend import models, auth

@pytest.fixture(scope="function")
def client():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Seed Admin User
    db = TestingSessionLocal()
    hashed_password = auth.get_password_hash("password")
    admin = models.User(
        username="admin",
        hashed_password=hashed_password,
        role=models.UserRole.GROUP_HEAD
    )
    db.add(admin)
    db.commit()
    db.close()

    with TestClient(app) as c:
        yield c
    # Drop tables
    Base.metadata.drop_all(bind=engine)
