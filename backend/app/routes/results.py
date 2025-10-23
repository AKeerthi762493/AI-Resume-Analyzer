from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import database, models, schemas

router = APIRouter(tags=["Results"])

@router.get("/results/jds")
async def get_all_job_descriptions(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    jds = db.query(models.JobDescription).offset(skip).limit(limit).all()
    return [schemas.jd_response(jd) for jd in jds]

@router.get("/results/resumes")
async def get_all_resumes(job_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    query = db.query(models.Resume)
    if job_id:
        query = query.filter(models.Resume.job_id == job_id)
    resumes = query.offset(skip).limit(limit).all()
    return [schemas.resume_response(resume) for resume in resumes]

@router.get("/results/job/{job_id}/resumes")
async def get_resumes_for_job(job_id: int, db: Session = Depends(database.get_db)):
    jd = db.query(models.JobDescription).filter(models.JobDescription.id == job_id).first()
    if not jd:
        raise HTTPException(status_code=404, detail=f"Job description with ID {job_id} not found")
    
    resumes = db.query(models.Resume).filter(models.Resume.job_id == job_id).order_by(models.Resume.relevance_score.desc()).all()
    return [schemas.resume_response(resume) for resume in resumes]
