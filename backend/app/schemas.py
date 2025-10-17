# Simple dict-based responses instead of Pydantic models
from typing import Dict, Any, List, Optional

def upload_response(message: str, id: int) -> Dict[str, Any]:
    return {"message": message, "id": id}

def jd_response(jd) -> Dict[str, Any]:
    return {
        "id": jd.id,
        "role_title": jd.role_title,
        "must_have": jd.must_have,
        "good_to_have": jd.good_to_have,
        "qualifications": jd.qualifications,
        "created_at": str(jd.created_at)
    }

def resume_response(resume) -> Dict[str, Any]:
    return {
        "id": resume.id,
        "student_name": resume.student_name,
        "relevance_score": resume.relevance_score,
        "verdict": resume.verdict,
        "missing_skills": resume.missing_skills,
        "job_id": resume.job_id,
        "created_at": str(resume.created_at)
    }
