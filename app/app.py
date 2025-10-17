from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
import re
import PyPDF2
import docx

# === Initialize Flask app ===
app = Flask(__name__)
CORS(app)

# === Configuration ===
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

os.makedirs(os.path.join(UPLOAD_FOLDER, 'jd'), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'resumes'), exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# === In-memory store ===
data_store = {
    'job_descriptions': {},
    'resumes': {},
    'analyses': {}
}

# === Helpers ===
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_file(file_path, file_extension):
    """Extracts text from PDF, DOCX, or TXT files."""
    try:
        if file_extension == 'pdf':
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                return ''.join(page.extract_text() or '' for page in reader.pages)
        elif file_extension == 'docx':
            doc = docx.Document(file_path)
            return '\n'.join(p.text for p in doc.paragraphs)
        elif file_extension == 'txt':
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
    except Exception as e:
        print(f"Error extracting text: {e}")
    return ''

def extract_years_of_experience(text):
    patterns = [
        r'(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp)',
        r'experience[:\s]+(\d+)\+?\s*(?:years?|yrs?)',
        r'(\d+)\+?\s*(?:years?|yrs?)\s+in'
    ]
    years = []
    for pattern in patterns:
        matches = re.findall(pattern, text.lower())
        years.extend([int(m) for m in matches if m.isdigit() and 0 < int(m) < 50])
    return max(years) if years else 0

def extract_skills_from_text(text):
    """Extracts common technical skills from text."""
    text_lower = text.lower()
    skills_dict = {
        'python': 'Python', 'java': 'Java', 'javascript': 'JavaScript',
        'typescript': 'TypeScript', 'c++': 'C++', 'c#': 'C#',
        'react': 'React', 'angular': 'Angular', 'vue': 'Vue.js',
        'node.js': 'Node.js', 'nodejs': 'Node.js',
        'django': 'Django', 'flask': 'Flask', 'spring': 'Spring',
        'aws': 'AWS', 'azure': 'Azure', 'docker': 'Docker',
        'kubernetes': 'Kubernetes', 'git': 'Git',
        'mongodb': 'MongoDB', 'postgresql': 'PostgreSQL', 'mysql': 'MySQL',
        'html': 'HTML', 'css': 'CSS', 'sql': 'SQL',
        'machine learning': 'Machine Learning', 'tensorflow': 'TensorFlow',
        'agile': 'Agile', 'scrum': 'Scrum', 'devops': 'DevOps'
    }
    found = [v for k, v in skills_dict.items() if re.search(rf'\b{re.escape(k)}\b', text_lower)]
    return list(set(found))

def calculate_skill_match(resume_text, jd_text):
    resume_skills = set(extract_skills_from_text(resume_text))
    jd_skills = set(extract_skills_from_text(jd_text))
    matched = sorted(list(resume_skills & jd_skills))
    missing = sorted(list(jd_skills - resume_skills))
    return matched[:15], missing[:10]

def calculate_relevance_score(resume_text, jd_text):
    if not resume_text or not jd_text:
        return 50, 'Medium'
    jd_skills = set(extract_skills_from_text(jd_text))
    resume_skills = set(extract_skills_from_text(resume_text))
    if not jd_skills:
        return 50, 'Medium'
    match_rate = len(jd_skills & resume_skills) / len(jd_skills)
    score = int(match_rate * 80 + 20)
    level = 'High' if score >= 70 else 'Medium' if score >= 40 else 'Low'
    return min(100, score), level

# === Routes ===
@app.route('/')
def home():
    return jsonify({"message": "Resume Analyzer Flask API", "status": "running"})

@app.route('/api/health')
def health():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "job_descriptions_count": len(data_store['job_descriptions']),
        "resumes_count": len(data_store['resumes'])
    })

# === Entry Point ===
# Vercel automatically uses this app object
app = app
