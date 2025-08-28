from fastapi import APIRouter, Depends
from app.core.security import get_current_user, require_roles

router = APIRouter()

@router.get("/metrics")
async def get_system_metrics(
    current_user: dict = Depends(require_roles(["admin"]))
):
    """Get system metrics"""
    return {
        "active_users": 142,
        "api_calls_today": 1247,
        "token_usage": 89200,
        "system_status": "healthy"
    }

@router.get("/users")
async def get_users(
    current_user: dict = Depends(require_roles(["admin"]))
):
    """Get all users"""
    return [
        {"id": "1", "email": "admin@dnb.no", "name": "Admin User", "roles": ["admin"]},
        {"id": "2", "email": "analyst@dnb.no", "name": "Analyst User", "roles": ["analyst"]}
    ]
