from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.core.security import get_current_user

router = APIRouter()

@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload and ingest dataset"""
    return {"message": f"Dataset {file.filename} uploaded successfully", "job_id": "mock-job-123"}

@router.get("/status/{job_id}")
async def get_ingestion_status(job_id: str):
    """Get ingestion job status"""
    return {"job_id": job_id, "status": "completed", "progress": 100}
