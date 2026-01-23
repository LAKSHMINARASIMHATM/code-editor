from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel, EmailStr, validator
from models.user import User
from auth.jwt_handler import create_access_token
from middleware.auth_middleware import get_current_user
import re

router = APIRouter(prefix="/api/auth", tags=["authentication"])

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    
    @validator('username')
    def username_valid(cls, v):
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('Username can only contain letters, numbers, underscores, and hyphens')
        return v
    
    @validator('password')
    def password_strong(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    token: str
    user: dict

@router.post("/register", response_model=AuthResponse)
async def register(data: RegisterRequest):
    """
    Register a new user
    
    Args:
        data: Registration data (username, email, password)
        
    Returns:
        JWT token and user data
    """
    # Check if user already exists
    if User.get_by_email(data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    if User.get_by_username(data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create user
    try:
        user = User.create(
            username=data.username,
            email=data.email,
            password=data.password
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )
    
    # Generate token
    token = create_access_token(data={"user_id": user.id, "email": user.email})
    
    return {
        "token": token,
        "user": user.to_dict()
    }

@router.post("/login", response_model=AuthResponse)
async def login(data: LoginRequest):
    """
    Login user
    
    Args:
        data: Login credentials (email, password)
        
    Returns:
        JWT token and user data
    """
    # Authenticate user
    user = User.authenticate(data.email, data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Generate token
    token = create_access_token(data={"user_id": user.id, "email": user.email})
    
    return {
        "token": token,
        "user": user.to_dict()
    }

@router.get("/me")
async def get_me(request: Request):
    """
    Get current user data
    
    Returns:
        Current user information
    """
    user = await get_current_user(request)
    return user.to_dict()

@router.post("/logout")
async def logout(request: Request):
    """
    Logout user (client should delete token)
    
    Returns:
        Success message
    """
    # In JWT, logout is handled client-side by removing the token
    # Here we just verify the user is authenticated
    await get_current_user(request)
    
    return {"message": "Logged out successfully"}
