from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None = None
    is_active: bool = True

    class Config:
        from_attributes = True

# Alias UserOut to UserResponse to prevent any import mismatches
UserOut = UserResponse

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
