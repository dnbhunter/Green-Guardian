from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
import structlog

from app.core.config import settings
from app.core.security import (
    create_access_token,
    get_current_user,
    verify_azure_ad_token,
)
from app.core.exceptions import AuthenticationError, AuthorizationError

logger = structlog.get_logger(__name__)

router = APIRouter()

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int

class TokenData(BaseModel):
    username: str = None

class User(BaseModel):
    id: str
    email: str
    name: str
    roles: list[str]
    department: str = None
    avatar: str = None
    preferences: dict = {}

class UserCreate(BaseModel):
    email: str
    name: str
    roles: list[str] = ["analyst"]
    department: str = None

class UserUpdate(BaseModel):
    name: str = None
    roles: list[str] = None
    department: str = None
    preferences: dict = None

@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login with username/password (for development)"""
    try:
        # In production, this would validate against Azure AD or database
        # For demo purposes, accept any username/password
        if not form_data.username:
            raise AuthenticationError("Username is required")
        
        logger.info("user_login_attempt", username=form_data.username)
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            subject=form_data.username, expires_delta=access_token_expires
        )
        
        logger.info("user_login_success", username=form_data.username)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }
        
    except Exception as e:
        logger.error("login_failed", username=form_data.username, error=str(e))
        raise AuthenticationError("Invalid credentials")

@router.post("/azure-login", response_model=Token)
async def azure_ad_login(azure_token: str):
    """Login with Azure AD token"""
    try:
        # Verify Azure AD token
        payload = await verify_azure_ad_token(azure_token)
        
        user_id = payload.get("sub")
        user_email = payload.get("email")
        
        logger.info("azure_login_success", user_id=user_id, email=user_email)
        
        # Create our own access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            subject=user_id, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }
        
    except Exception as e:
        logger.error("azure_login_failed", error=str(e))
        raise AuthenticationError("Azure AD authentication failed")

@router.get("/me", response_model=User)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    try:
        # In production, fetch from database
        user_data = {
            "id": current_user.get("id"),
            "email": current_user.get("email", "user@dnb.no"),
            "name": current_user.get("name", "Test User"),
            "roles": current_user.get("roles", ["analyst"]),
            "department": current_user.get("department", "Sustainability"),
            "avatar": current_user.get("avatar"),
            "preferences": current_user.get("preferences", {
                "theme": "light",
                "language": "en",
                "notifications": {
                    "email": True,
                    "push": True,
                    "desktop": True,
                    "sustainability_alerts": True,
                    "portfolio_updates": True,
                }
            }),
        }
        
        return User(**user_data)
        
    except Exception as e:
        logger.error("get_user_failed", user_id=current_user.get("id"), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user information"
        )

@router.put("/me", response_model=User)
async def update_user(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update current user information"""
    try:
        # In production, update database
        updated_data = current_user.copy()
        
        if user_update.name is not None:
            updated_data["name"] = user_update.name
        if user_update.department is not None:
            updated_data["department"] = user_update.department
        if user_update.preferences is not None:
            updated_data["preferences"] = user_update.preferences
            
        # Only admins can update roles
        if user_update.roles is not None:
            if "admin" not in current_user.get("roles", []):
                raise AuthorizationError("Only admins can update roles")
            updated_data["roles"] = user_update.roles
        
        logger.info("user_updated", user_id=current_user.get("id"))
        
        return User(**updated_data)
        
    except AuthorizationError:
        raise
    except Exception as e:
        logger.error("update_user_failed", user_id=current_user.get("id"), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user information"
        )

@router.post("/refresh")
async def refresh_token(current_user: dict = Depends(get_current_user)):
    """Refresh access token"""
    try:
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            subject=current_user.get("id"), expires_delta=access_token_expires
        )
        
        logger.info("token_refreshed", user_id=current_user.get("id"))
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }
        
    except Exception as e:
        logger.error("token_refresh_failed", error=str(e))
        raise AuthenticationError("Failed to refresh token")

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout user"""
    try:
        logger.info("user_logout", user_id=current_user.get("id"))
        
        # In production, you might invalidate the token in a blacklist
        return {"message": "Successfully logged out"}
        
    except Exception as e:
        logger.error("logout_failed", error=str(e))
        return {"message": "Logout completed"}
