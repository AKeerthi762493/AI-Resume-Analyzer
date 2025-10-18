from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
import re
import PyPDF2
import docx
import hashlib

# === Initialize Flask app ===
app = Flask(__name__)
CORS(app)

# === Configuration ===
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_TEXT_LENGTH = 5000  # Limit text length in responses

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

def truncate_text(text, max_length=MAX_TEXT_LENGTH):
    """Truncate text to prevent payload size issues"""
    if not text:
        return ""
    if len(text) <= max_length:
        return text
    return text[:max_length] + "... (truncated)"

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

def create_summary_response(data):
    """Create a lightweight summary response to avoid payload size issues"""
    if isinstance(data, dict):
        summary = {}
        for key, value in data.items():
            if key in ['text', 'content', 'raw_text', 'full_text']:
                # Truncate long text fields
                summary[key] = truncate_text(value, 1000)
            elif isinstance(value, str) and len(value) > 2000:
                summary[key] = truncate_text(value, 2000)
            else:
                summary[key] = value
        return summary
    return data

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

@app.route('/api/job-description', methods=['POST'])
def upload_job_description():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({"error": "Invalid file type"}), 400
        
        filename = f"jd_{datetime.now().timestamp()}_{file.filename}"
        file_path = os.path.join(UPLOAD_FOLDER, 'jd', filename)
        file.save(file_path)
        
        file_ext = filename.rsplit('.', 1)[1].lower()
        text = extract_text_from_file(file_path, file_ext)
        
        jd_id = hashlib.md5(filename.encode()).hexdigest()[:12]
        
        data_store['job_descriptions'][jd_id] = {
            'id': jd_id,
            'filename': file.filename,
            'text': text,  # Keep full text in memory
            'skills': extract_skills_from_text(text),
            'uploaded_at': datetime.now().isoformat()
        }
        
        # Return truncated response
        response_data = {
            'id': jd_id,
            'filename': file.filename,
            'text': truncate_text(text, 500),  # Only send preview
            'skills': extract_skills_from_text(text)[:20],  # Limit skills
            'uploaded_at': data_store['job_descriptions'][jd_id]['uploaded_at']
        }
        
        return jsonify({"success": True, "data": response_data}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/resume', methods=['POST'])
def upload_resume():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({"error": "Invalid file type"}), 400
        
        jd_id = request.form.get('jd_id')
        if not jd_id or jd_id not in data_store['job_descriptions']:
            return jsonify({"error": "Valid Job Description ID required"}), 400
        
        filename = f"resume_{datetime.now().timestamp()}_{file.filename}"
        file_path = os.path.join(UPLOAD_FOLDER, 'resumes', filename)
        file.save(file_path)
        
        file_ext = filename.rsplit('.', 1)[1].lower()
        text = extract_text_from_file(file_path, file_ext)
        
        resume_id = hashlib.md5(filename.encode()).hexdigest()[:12]
        
        data_store['resumes'][resume_id] = {
            'id': resume_id,
            'filename': file.filename,
            'text': text,  # Keep full text in memory
            'jd_id': jd_id,
            'uploaded_at': datetime.now().isoformat()
        }
        
        # Return truncated response
        response_data = {
            'id': resume_id,
            'filename': file.filename,
            'text': truncate_text(text, 500),  # Only send preview
            'jd_id': jd_id,
            'uploaded_at': data_store['resumes'][resume_id]['uploaded_at']
        }
        
        return jsonify({"success": True, "data": response_data}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/analyze/<resume_id>', methods=['GET'])
def analyze_resume(resume_id):
    try:
        if resume_id not in data_store['resumes']:
            return jsonify({"error": "Resume not found"}), 404
        
        resume = data_store['resumes'][resume_id]
        jd = data_store['job_descriptions'].get(resume['jd_id'])
        
        if not jd:
            return jsonify({"error": "Job description not found"}), 404
        
        resume_text = resume['text']
        jd_text = jd['text']
        
        matched_skills, missing_skills = calculate_skill_match(resume_text, jd_text)
        score, level = calculate_relevance_score(resume_text, jd_text)
        experience_years = extract_years_of_experience(resume_text)
        
        analysis = {
            'resume_id': resume_id,
            'resume_filename': resume['filename'],
            'jd_filename': jd['filename'],
            'score': score,
            'relevance_level': level,
            'matched_skills': matched_skills[:15],  # Limit to 15
            'missing_skills': missing_skills[:10],  # Limit to 10
            'experience_years': experience_years,
            'analyzed_at': datetime.now().isoformat()
        }
        
        data_store['analyses'][resume_id] = analysis
        
        return jsonify({"success": True, "data": analysis}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/analyses', methods=['GET'])
def get_all_analyses():
    try:
        # Return only summary data, not full text
        analyses_list = []
        for analysis_id, analysis in data_store['analyses'].items():
            analyses_list.append({
                'resume_id': analysis['resume_id'],
                'resume_filename': analysis['resume_filename'],
                'score': analysis['score'],
                'relevance_level': analysis['relevance_level'],
                'matched_skills_count': len(analysis['matched_skills']),
                'missing_skills_count': len(analysis['missing_skills']),
                'experience_years': analysis['experience_years']
            })
        
        # Limit to last 50 analyses to prevent payload issues
        return jsonify({
            "success": True, 
            "data": analyses_list[-50:],
            "total": len(analyses_list)
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/analysis/<resume_id>', methods=['GET'])
def get_analysis_detail(resume_id):
    try:
        if resume_id not in data_store['analyses']:
            return jsonify({"error": "Analysis not found"}), 404
        
        analysis = data_store['analyses'][resume_id]
        return jsonify({"success": True, "data": analysis}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# === Entry Point ===
# Vercel automatically uses this app object
app = app