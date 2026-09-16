from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.user import UserCreate, UserResponse
from app.services import auth_service

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Register a new user account in the database.
    """
    return await auth_service.register_user(db, user_in)

@router.post("/login")
async def login(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Authenticate user and return access token.
    """
    return await auth_service.authenticate_user(db, user_in.email, user_in.password)
