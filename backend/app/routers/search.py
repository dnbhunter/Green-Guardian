from fastapi import APIRouter, Depends, Query
from app.core.security import get_current_user
from app.services.search_client import SearchService

router = APIRouter()

@router.get("/assets")
async def search_assets(
    q: str = Query(..., description="Search query"),
    current_user: dict = Depends(get_current_user),
    search_service: SearchService = Depends()
):
    """Search assets"""
    results = await search_service.search_documents(query=q, top_k=10)
    return {"query": q, "results": results, "total": len(results)}

@router.get("/companies") 
async def search_companies(
    q: str = Query(..., description="Search query"),
    current_user: dict = Depends(get_current_user)
):
    """Search companies"""
    return {"query": q, "results": [], "total": 0}
