from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from datetime import datetime
import json
import uuid
from io import BytesIO
import re

app = Flask(__name__)

# ✅ CORS Configuration for Netlify - FIXED
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:5173",
            "http://localhost:8080",
            "http://localhost:3000",
            "https://*.netlify.app",  # All Netlify preview deployments
            "https://innomatics-resume-analyzer.netlify.app",  # ✅ Fixed: Removed trailing slash
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept"],
        "supports_credentials": False,
        "max_age": 3600
    },
    r"/": {
        "origins": "*",
        "methods": ["GET"]
    }
})

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Create upload directories
os.makedirs(os.path.join(UPLOAD_FOLDER, 'jd'), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'resumes'), exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# In-memory data storage
data_store = {
    'job_descriptions': {},
    'resumes': {},
    'analyses': {}
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_text_from_file(file_path, file_extension):
    """Extract text content from uploaded files"""
    try:
        if file_extension == 'pdf':
            try:
                import PyPDF2
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    text = ''
                    for page in pdf_reader.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + ' '
                    return text
            except ImportError:
                return "PDF extraction not available. Install PyPDF2."
        elif file_extension == 'docx':
            try:
                import docx
                doc = docx.Document(file_path)
                text = '\n'.join([paragraph.text for paragraph in doc.paragraphs])
                return text
            except ImportError:
                return "DOCX extraction not available. Install python-docx."
        elif file_extension == 'txt':
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        else:
            return ''
    except Exception as e:
        print(f"Error extracting text: {str(e)}")
        return ''

def is_valid_resume(text_content):
    """Lenient validation"""
    if not text_content or len(text_content.strip()) < 20:
        return False, "File appears to be empty"
    return True, None

def is_valid_job_description(text_content):
    """Lenient validation"""
    if not text_content or len(text_content.strip()) < 20:
        return False, "File appears to be empty"
    return True, None

def extract_years_of_experience(text):
    """Extract years of experience"""
    patterns = [
        r'(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp)',
        r'experience[:\s]+(\d+)\+?\s*(?:years?|yrs?)',
        r'(\d+)\+?\s*(?:years?|yrs?)\s+in',
    ]
    
    years_found = []
    for pattern in patterns:
        matches = re.findall(pattern, text.lower())
        years_found.extend([int(m) for m in matches if m.isdigit() and 0 < int(m) < 50])
    
    date_ranges = re.findall(r'(20\d{2})\s*[-–]\s*(present|current|20\d{2})', text.lower())
    for start, end in date_ranges:
        try:
            if end in ['present', 'current']:
                years = 2025 - int(start)
            else:
                years = int(end) - int(start)
            if 0 < years < 50:
                years_found.append(years)
        except:
            continue
    
    return max(years_found) if years_found else 0

def extract_location(text):
    """Extract location"""
    text_lower = text.lower()
    
    cities = {
        'bangalore': 'Bangalore', 'bengaluru': 'Bangalore',
        'hyderabad': 'Hyderabad', 'pune': 'Pune', 'mumbai': 'Mumbai',
        'delhi': 'Delhi NCR', 'noida': 'Delhi NCR', 'gurgaon': 'Delhi NCR',
        'chennai': 'Chennai', 'kolkata': 'Kolkata', 'ahmedabad': 'Ahmedabad',
        'jaipur': 'Jaipur', 'kochi': 'Kochi', 'indore': 'Indore'
    }
    
    for city_key, city_name in cities.items():
        if re.search(rf'\b{city_key}\b', text_lower):
            return city_name
    
    return 'Not specified'

def extract_skills_from_text(text):
    """Extract technical skills"""
    text_lower = text.lower()
    
    all_skills = {
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
    
    found_skills = []
    for skill_key, skill_name in all_skills.items():
        if re.search(rf'\b{re.escape(skill_key)}\b', text_lower):
            if skill_name not in found_skills:
                found_skills.append(skill_name)
    
    return found_skills

def calculate_skill_match(resume_text, jd_text):
    """Calculate matched and missing skills"""
    resume_skills = set(extract_skills_from_text(resume_text))
    jd_skills = set(extract_skills_from_text(jd_text))
    
    matched_skills = sorted(list(resume_skills.intersection(jd_skills)))
    missing_skills = sorted(list(jd_skills - resume_skills))
    
    return matched_skills[:15], missing_skills[:10]

def calculate_relevance_score(resume_text, jd_text):
    """Calculate relevance score"""
    if not resume_text or not jd_text:
        return 50, 'Medium'
    
    jd_skills = set(extract_skills_from_text(jd_text))
    resume_skills = set(extract_skills_from_text(resume_text))
    
    if not jd_skills:
        return 50, 'Medium'
    
    matching_skills = jd_skills.intersection(resume_skills)
    skill_match_rate = len(matching_skills) / len(jd_skills)
    
    jd_experience = extract_years_of_experience(jd_text)
    resume_experience = extract_years_of_experience(resume_text)
    
    exp_score = 0
    if jd_experience > 0:
        if resume_experience >= jd_experience:
            exp_score = 20
        elif resume_experience >= jd_experience * 0.7:
            exp_score = 15
        else:
            exp_score = 10
    else:
        exp_score = 15
    
    score = int((skill_match_rate * 80) + exp_score)
    score = min(100, max(0, score))
    
    if score >= 70:
        relevance = 'High'
    elif score >= 40:
        relevance = 'Medium'
    else:
        relevance = 'Low'
    
    return score, relevance

@app.route('/api/upload', methods=['POST'])
def upload_files():
    try:
        if 'files' not in request.files:
            return jsonify({'success': False, 'error': 'No files provided'}), 400
        
        files = request.files.getlist('files')
        upload_type = request.form.get('type', 'resume')
        
        if not files:
            return jsonify({'success': False, 'error': 'No files selected'}), 400
        
        uploaded_files = []
        file_ids = []
        validation_errors = []
        
        for file in files:
            if file.filename == '':
                continue
                
            if not allowed_file(file.filename):
                validation_errors.append(f'{file.filename}: Invalid file type')
                continue
            
            filename_lower = secure_filename(file.filename).lower()
            skip_file = False
            
            # Check if file already exists in JD section
            for jd_id, jd_data in data_store['job_descriptions'].items():
                if jd_data['filename'].lower() == filename_lower:
                    if upload_type == 'jd':
                        validation_errors.append(f'{file.filename}: This file is already uploaded as a Job Description')
                    else:
                        validation_errors.append(f'{file.filename}: Cannot upload JD file as resume. This file already exists as a Job Description')
                    skip_file = True
                    break
            
            # Check if file already exists in Resume section
            if not skip_file:
                for resume_id, resume_data in data_store['resumes'].items():
                    if resume_data['filename'].lower() == filename_lower:
                        if upload_type == 'resume':
                            validation_errors.append(f'{file.filename}: This file is already uploaded as a Resume')
                        else:
                            validation_errors.append(f'{file.filename}: Cannot upload resume file as JD. This file already exists as a Resume')
                        skip_file = True
                        break
            
            if skip_file:
                continue
            
            file_id = str(uuid.uuid4())
            filename = secure_filename(file.filename)
            file_extension = filename.rsplit('.', 1)[1].lower()
            
            folder = 'jd' if upload_type == 'jd' else 'resumes'
            file_path = os.path.join(UPLOAD_FOLDER, folder, f"{file_id}_{filename}")
            file.save(file_path)
            
            text_content = extract_text_from_file(file_path, file_extension)
            
            if upload_type == 'resume':
                is_valid, error_msg = is_valid_resume(text_content)
                if not is_valid:
                    os.remove(file_path)
                    validation_errors.append(f'{filename}: {error_msg}')
                    continue
            elif upload_type == 'jd':
                is_valid, error_msg = is_valid_job_description(text_content)
                if not is_valid:
                    os.remove(file_path)
                    validation_errors.append(f'{filename}: {error_msg}')
                    continue
            
            file_data = {
                'id': file_id,
                'filename': filename,
                'file_path': file_path,
                'upload_type': upload_type,
                'uploaded_at': datetime.now().isoformat(),
                'size': os.path.getsize(file_path),
                'text_content': text_content
            }
            
            if upload_type == 'jd':
                data_store['job_descriptions'][file_id] = file_data
            else:
                data_store['resumes'][file_id] = file_data
            
            uploaded_files.append({
                'id': file_id,
                'filename': filename,
                'size': file_data['size']
            })
            file_ids.append(file_id)
        
        if len(uploaded_files) == 0 and len(validation_errors) > 0:
            return jsonify({
                'success': False,
                'error': 'All files failed validation',
                'validation_errors': validation_errors
            }), 400
        
        response_data = {
            'success': True,
            'message': f'{len(uploaded_files)} file(s) uploaded successfully',
            'data': {
                'fileIds': file_ids,
                'fileId': file_ids[0] if len(file_ids) == 1 else None,
                'files': uploaded_files
            }
        }
        
        if validation_errors:
            response_data['warnings'] = validation_errors
        
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"Upload error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze_data():
    try:
        data = request.get_json()
        job_description_id = data.get('jobDescriptionId')
        resume_ids = data.get('resumeIds', [])
        
        if not job_description_id or not resume_ids:
            return jsonify({'success': False, 'error': 'Missing parameters'}), 400
        
        jd = data_store['job_descriptions'].get(job_description_id)
        if not jd:
            return jsonify({'success': False, 'error': 'Job description not found'}), 404
        
        results = []
        for resume_id in resume_ids:
            resume = data_store['resumes'].get(resume_id)
            if not resume:
                continue
            
            score, relevance = calculate_relevance_score(
                resume['text_content'],
                jd['text_content']
            )
            
            location = extract_location(resume['text_content'])
            experience_years = extract_years_of_experience(resume['text_content'])
            matched_skills, missing_skills = calculate_skill_match(
                resume['text_content'],
                jd['text_content']
            )
            
            result = {
                'resumeId': resume_id,
                'filename': resume['filename'],
                'score': score,
                'relevance': relevance,
                'analyzed_at': datetime.now().isoformat(),
                'location': location,
                'experience': f"{experience_years} years" if experience_years > 0 else "Not specified",
                'matchedSkills': matched_skills,
                'missingSkills': missing_skills
            }
            results.append(result)
            data_store['resumes'][resume_id]['analysis'] = result
        
        analysis_id = str(uuid.uuid4())
        data_store['analyses'][analysis_id] = {
            'id': analysis_id,
            'jobDescriptionId': job_description_id,
            'results': results,
            'created_at': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'message': 'Analysis completed',
            'data': {'analysisId': analysis_id, 'results': results},
            'results': results
        }), 200
        
    except Exception as e:
        print(f"Analysis error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analyses', methods=['GET'])
def get_all_analyses():
    try:
        all_results = []
        for resume_id, resume_data in data_store['resumes'].items():
            if 'analysis' in resume_data:
                all_results.append(resume_data['analysis'])
        return jsonify({'success': True, 'results': all_results}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/files', methods=['GET'])
def get_uploaded_files():
    try:
        file_type = request.args.get('type', 'all')
        files_list = []
        
        if file_type in ['jd', 'all']:
            for jd_id, jd_data in data_store['job_descriptions'].items():
                files_list.append({
                    'id': jd_id,
                    'filename': jd_data['filename'],
                    'type': 'jd',
                    'uploaded_at': jd_data['uploaded_at'],
                    'size': jd_data['size']
                })
        
        if file_type in ['resume', 'all']:
            for resume_id, resume_data in data_store['resumes'].items():
                files_list.append({
                    'id': resume_id,
                    'filename': resume_data['filename'],
                    'type': 'resume',
                    'uploaded_at': resume_data['uploaded_at'],
                    'size': resume_data['size']
                })
        
        return jsonify({'success': True, 'files': files_list}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'job_descriptions_count': len(data_store['job_descriptions']),
        'resumes_count': len(data_store['resumes']),
        'analyses_count': len(data_store['analyses'])
    }), 200

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'message': 'Resume Screening API',
        'version': '1.0.0',
        'endpoints': {
            'health': '/api/health',
            'upload': '/api/upload',
            'analyze': '/api/analyze',
            'files': '/api/files'
        }
    }), 200

if __name__ == '__main__':
    print("Starting Resume Screening API...")
    print("Server: http://localhost:5000")
    print("Health: http://localhost:5000/api/health")
    app.run(debug=True, host='0.0.0.0', port=5000)