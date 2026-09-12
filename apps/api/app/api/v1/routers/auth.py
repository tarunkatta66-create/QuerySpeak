from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.user import UserCreate, UserLogin, UserOut
from app.schemas.token import Token, TokenRefreshRequest
from app.services import auth_service
from app.api.v1.deps import get_current_user
from app.models.models import User

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    return await auth_service.register_user(db, user_in)


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await auth_service.authenticate_user(db, credentials)
    return auth_service.create_tokens_for_user(user)


@router.post("/refresh", response_model=Token)
async def refresh_token(request: TokenRefreshRequest, db: AsyncSession = Depends(get_db)):
    return await auth_service.refresh_access_token(db, request.refresh_token)


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
