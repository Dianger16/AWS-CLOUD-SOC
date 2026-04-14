from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

from app.security.auth import create_access_token, Token
from app.utils.logger import get_logger

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = get_logger(__name__)

DEMO_USERS ={
    "admin": {
        "username": "admin",
        "password": "SOC2027",
        "role": "admin"
    },
    "analyst": {
        "username": "analyst",
        "password": "A2027",
        "role": "read_only",
    },
}

@router.post("/token", response_model=Token, summary="Obtain JWT access token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()) -> Token:
    user = DEMO_USERS.get(form_data.username)
    if not user or user["password"] != form_data.password:
        logger.warning(f"Failed login attempt for user: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(data={"sub": user["username"], "role": user["role"]})
    logger.info(f"User '{user['username']}' logged in successfully.")
    return Token(access_token=token, token_type="bearer")

class HealthResponse(BaseModel):
    status: str
    version: str

@router.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    return HealthResponse(status="healthy", version="1.0.0")





