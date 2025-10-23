from flask import Blueprint, request, jsonify
import os
from werkzeug.utils import secure_filename

upload_bp = Blueprint('upload', __name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'doc', 'docx'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Upload Job Description endpoint
@upload_bp.route('/api/upload/jd', methods=['POST'])
def upload_job_description():
    try:
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        
        # Check if file is empty
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Validate file type
        if not allowed_file(file.filename):
            return jsonify({"error": "Invalid file type. Allowed: txt, pdf, doc, docx"}), 400
        
        # Save the file
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Read file content (for text files)
        file_content = ""
        if filename.endswith('.txt'):
            with open(filepath, 'r', encoding='utf-8') as f:
                file_content = f.read()
        
        # TODO: Add your job description processing logic here
        # For now, just return success with basic info
        
        return jsonify({
            "message": "Job description uploaded successfully",
            "filename": filename,
            "job_id": 1,  # Replace with actual job ID from database
            "content_preview": file_content[:200] if file_content else "Binary file"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Upload Resume endpoint
@upload_bp.route('/api/upload/resume', methods=['POST'])
def upload_resume():
    try:
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        job_id = request.form.get('job_id')
        
        if not job_id:
            return jsonify({"error": "job_id is required"}), 400
        
        # Check if file is empty
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Validate file type
        if not allowed_file(file.filename):
            return jsonify({"error": "Invalid file type. Allowed: txt, pdf, doc, docx"}), 400
        
        # Save the file
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, f"resume_{job_id}_{filename}")
        file.save(filepath)
        
        # TODO: Add your resume processing logic here
        
        return jsonify({
            "message": "Resume uploaded successfully",
            "filename": filename,
            "job_id": job_id,
            "resume_id": 1  # Replace with actual resume ID from database
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500