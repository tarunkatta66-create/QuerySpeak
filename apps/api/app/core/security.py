from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
from app.core.config import settings

# JWT Algorithm
ALGORITHM = "HS256"

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Default expiry of 60 minutes if not present in settings
        expire_minutes = getattr(settings, "ACCESS_TOKEN_EXPIRE_MINUTES", 60)
        expire = datetime.utcnow() + timedelta(minutes=expire_minutes)
        
    to_encode.update({"exp": expire})
    
    # Generate JWT Token using python-jose
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
