from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from .. import models, schemas, auth, database
import pyotp

router = APIRouter(tags=["auth"])

@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), mfa_code: str = Form(None), db: Session = Depends(database.get_db)):
    import traceback
    try:
        user = db.query(models.User).filter(models.User.username == form_data.username).first()
    except Exception as e:
        print(f"LOGIN ERROR: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user.mfa_secret:
        if not mfa_code:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="MFA_REQUIRED",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not auth.verify_totp(user.mfa_secret, mfa_code):
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid MFA code",
                headers={"WWW-Authenticate": "Bearer"},
            )

    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/auth/mfa/setup")
def mfa_setup(current_user: models.User = Depends(auth.get_current_active_user)):
    secret = auth.generate_totp_secret()
    # In a real app, we would save this temporarily or return it to be saved after verification
    # For simplicity, we return it and the frontend calls enable with the code
    return {"secret": secret, "uri": pyotp.TOTP(secret).provisioning_uri(name=current_user.username, issuer_name="SyncDeck")}

@router.post("/auth/mfa/enable")
def mfa_enable(secret: str = Form(...), code: str = Form(...), db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    if not auth.verify_totp(secret, code):
        raise HTTPException(status_code=400, detail="Invalid code")
    
    current_user.mfa_secret = secret
    db.commit()
    return {"message": "MFA enabled"}
