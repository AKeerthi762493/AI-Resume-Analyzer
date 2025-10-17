import pdfplumber
import docx
import re
from sentence_transformers import SentenceTransformer, util
from typing import Dict, Tuple
import os

# Initialize the model globally to avoid reloading
try:
    model = SentenceTransformer("all-MiniLM-L6-v2")
except Exception as e:
    print(f"Error loading SentenceTransformer model: {e}")
    model = None

def extract_text(file_path: str) -> str:
    """Extract text from PDF or DOCX files."""
    try:
        if file_path.endswith(".pdf"):
            with pdfplumber.open(file_path) as pdf:
                text = " ".join([page.extract_text() or "" for page in pdf.pages])
                return text.strip()
        elif file_path.endswith(".docx"):
            doc = docx.Document(file_path)
            text = " ".join([para.text for para in doc.paragraphs])
            return text.strip()
        elif file_path.endswith(".txt"):
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read().strip()
        else:
            return ""
    except Exception as e:
        print(f"Error extracting text from {file_path}: {e}")
        return ""

def parse_jd(text: str) -> Dict[str, str]:
    """Parse job description text to extract structured information."""
    text = text.lower()  # Convert to lowercase for better matching
    
    # Extract role/title
    role_patterns = [
        r"(?:job title|role|position|title)[:\-]?\s*(.+?)(?:\n|$)",
        r"(?:looking for|hiring)[:\-]?\s*(.+?)(?:\n|$)"
    ]
    role = "Unknown"
    for pattern in role_patterns:
        match = re.search(pattern, text, re.I | re.M)
        if match:
            role = match.group(1).strip()
            break
    
    # Extract must have skills
    must_have_patterns = [
        r"(?:must have|required|essential)[:\-]?\s*(.+?)(?=(?:good to have|preferred|qualifications|$))",
        r"(?:requirements)[:\-]?\s*(.+?)(?=(?:good to have|preferred|qualifications|$))"
    ]
    must_have = []
    for pattern in must_have_patterns:
        matches = re.findall(pattern, text, re.I | re.DOTALL)
        must_have.extend(matches)
    
    # Extract good to have skills
    good_to_have_patterns = [
        r"(?:good to have|preferred|nice to have|plus)[:\-]?\s*(.+?)(?=(?:qualifications|$))",
        r"(?:bonus)[:\-]?\s*(.+?)(?=(?:qualifications|$))"
    ]
    good_to_have = []
    for pattern in good_to_have_patterns:
        matches = re.findall(pattern, text, re.I | re.DOTALL)
        good_to_have.extend(matches)
    
    # Extract qualifications
    qualification_patterns = [
        r"(?:qualification|degree|education)[:\-]?\s*(.+?)(?=(?:experience|$))",
        r"(?:bachelor|master|phd|degree)[:\-]?\s*(.+?)(?=(?:experience|$))"
    ]
    qualifications = []
    for pattern in qualification_patterns:
        matches = re.findall(pattern, text, re.I | re.DOTALL)
        qualifications.extend(matches)
    
    return {
        "role_title": role[:255] if role else "Unknown",  # Limit length for database
        "must_have": " ".join(must_have).strip()[:1000],  # Limit length
        "good_to_have": " ".join(good_to_have).strip()[:1000],  # Limit length
        "qualifications": " ".join(qualifications).strip()[:1000]  # Limit length
    }

def compute_relevance(resume_text: str, jd_text: str) -> Tuple[float, str, str]:
    """Compute relevance score between resume and job description."""
    if not model:
        return 0.0, "Low", "Model not available"
    
    try:
        # Clean and prepare texts
        resume_text = resume_text.strip()
        jd_text = jd_text.strip()
        
        if not resume_text or not jd_text:
            return 0.0, "Low", "Insufficient text data"
        
        # Encode texts
        emb_resume = model.encode(resume_text, convert_to_tensor=True)
        emb_jd = model.encode(jd_text, convert_to_tensor=True)
        
        # Calculate cosine similarity
        score = util.cos_sim(emb_resume, emb_jd).item() * 100
        
        # Determine verdict
        if score > 75:
            verdict = "High"
        elif score > 50:
            verdict = "Medium"
        else:
            verdict = "Low"
        
        # Simple missing skills analysis (placeholder)
        missing_skills = analyze_missing_skills(resume_text, jd_text)
        
        return round(score, 2), verdict, missing_skills
        
    except Exception as e:
        print(f"Error computing relevance: {e}")
        return 0.0, "Low", f"Error: {str(e)}"

def analyze_missing_skills(resume_text: str, jd_text: str) -> str:
    """Analyze missing skills in resume compared to job description."""
    # This is a simple implementation - can be enhanced with NLP
    jd_lower = jd_text.lower()
    resume_lower = resume_text.lower()
    
    # Common technical skills to check
    skills = [
        'python', 'java', 'javascript', 'react', 'angular', 'vue', 'nodejs',
        'sql', 'mongodb', 'postgresql', 'mysql', 'aws', 'azure', 'docker',
        'kubernetes', 'git', 'machine learning', 'data analysis', 'ai'
    ]
    
    missing = []
    for skill in skills:
        if skill in jd_lower and skill not in resume_lower:
            missing.append(skill)
    
    return ", ".join(missing[:5]) if missing else "None identified"  # Limit to top 5

def clean_filename(filename: str) -> str:
    """Clean filename to extract student name."""
    # Remove file extension
    name = os.path.splitext(filename)[0]
    # Remove special characters and normalize
    name = re.sub(r'[^\w\s-]', '', name)
    return name.strip()[:100]  # Limit length