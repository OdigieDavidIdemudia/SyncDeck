from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError as integrity_error
from typing import List
from .. import models, schemas, auth, database

router = APIRouter(
    prefix="/teams",
    tags=["teams"]
)

@router.post("/", response_model=schemas.Team)
def create_team(team: schemas.TeamCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        if current_user.role != models.UserRole.GROUP_HEAD:
            raise HTTPException(status_code=403, detail="Not authorized")
            
        db_team = models.Team(name=team.name)
        db.add(db_team)
        db.commit()
        db.refresh(db_team)
        return db_team
    except integrity_error:
        db.rollback()
        raise HTTPException(status_code=400, detail="Team with this name already exists")
    except Exception as e:
        db.rollback()
        print(f"Error creating team: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/", response_model=List[schemas.Team])
def read_teams(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    teams = db.query(models.Team).offset(skip).limit(limit).all()
    return teams

@router.delete("/{team_id}")
def delete_team(team_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    if current_user.role != models.UserRole.GROUP_HEAD:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    db.delete(team)
    db.commit()
    return {"message": "Team deleted"}
