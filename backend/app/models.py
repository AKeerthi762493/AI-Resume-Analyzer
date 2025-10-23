from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, index=True)
    role_title = Column(String(255), nullable=False)
    must_have = Column(Text)
    good_to_have = Column(Text)
    qualifications = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship with resumes
    resumes = relationship("Resume", back_populates="job_description")

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    student_name = Column(String(255), nullable=False)
    raw_text = Column(Text)
    relevance_score = Column(Float)
    verdict = Column(String(50))
    missing_skills = Column(Text)
    job_id = Column(Integer, ForeignKey("job_descriptions.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship with job description
    job_description = relationship("JobDescription", back_populates="resumes")