from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional

from app.security.auth import create_access_token, Token, get_password_hash, verify_password
from app.database import get_db
from app.models.user_model import User
from app.utils.logger import get_logger
from sqlalchemy.orm import Session

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = get_logger(__name__)

class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None

class UserResponse(BaseModel):
    username: str
    message: str

@router.post("/register", response_model=UserResponse, summary="Create a new account")
async def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(User).filter(User.username == user_in.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Create new user
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role="user"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    logger.info(f"New user registered: {new_user.username}")
    return UserResponse(username=new_user.username, message="Registration successful")

@router.post("/token", response_model=Token, summary="Obtain JWT access token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> Token:
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        # Fallback for old demo users during migration if needed, 
        # but for clean feature we should use the DB.
        # Let's add a check for the old hardcoded admin once to seed if empty
        if form_data.username == "admin" and form_data.password == "SOC2027":
             # Auto-seed admin if database is empty and someone tries to login with old creds
             admin = User(
                 username="admin", 
                 hashed_password=get_password_hash("SOC2027"), 
                 role="admin"
             )
             db.add(admin)
             db.commit()
             db.refresh(admin)
             user = admin
        else:
            logger.warning(f"Failed login attempt for user: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

    token = create_access_token(data={"sub": user.username, "role": user.role})
    logger.info(f"User '{user.username}' logged in successfully.")
    return Token(access_token=token, token_type="bearer")

class HealthResponse(BaseModel):
    status: str
    version: str

@router.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    return HealthResponse(status="healthy", version="1.0.0")





