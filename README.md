# AI-Powered Resume Screening System

An intelligent resume screening platform that uses AI to analyze and match candidate resumes against job descriptions, providing accurate relevance scores and detailed skill analysis.

## Features

- **Automated Resume Analysis** - Upload multiple resumes and get instant AI-powered analysis
- **Smart Skill Matching** - Identifies matched and missing skills between resumes and job descriptions
- **Relevance Scoring** - Accurate scoring algorithm (0-100) based on skills, experience, and education
- **Location & Experience Extraction** - Automatically extracts candidate location and years of experience
- **Batch Processing** - Analyze multiple resumes simultaneously
- **Export Results** - Download analysis results in JSON or CSV format
- **Real-time Dashboard** - Interactive dashboard showing candidate rankings and analytics
- **File Validation** - Smart validation to ensure only valid resumes and JDs are processed

## Tech Stack

### Backend
- **Python 3.x** - Core backend language
- **Flask** - RESTful API framework
- **PyPDF2** - PDF text extraction
- **python-docx** - DOCX file processing
- **Flask-CORS** - Cross-origin resource sharing

### Frontend
- **React** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **Recharts** - Chart and visualization library

## Installation

### Prerequisites
- Python 3.8 or higher
- Node.js 16+ and npm/yarn
- pip (Python package manager)

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Create virtual environment:**
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install flask flask-cors PyPDF2 python-docx
```

4. **Run the Flask server:**
```bash
python3 app/main.py
```

The backend will start on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend  # or your frontend folder name
```

2. **Install dependencies:**
```bash
npm install
# or
yarn install
```

3. **Start development server:**
```bash
npm run dev
# or
yarn dev
```

The frontend will start on `http://localhost:8080` (or your configured port)

## API Endpoints

### Upload Files
```http
POST /api/upload
Content-Type: multipart/form-data

Body:
- files: File[] (PDF, DOCX, TXT)
- type: 'jd' | 'resume'
```

### Analyze Resumes
```http
POST /api/analyze
Content-Type: application/json

Body:
{
  "jobDescriptionId": "uuid",
  "resumeIds": ["uuid1", "uuid2", ...]
}
```

### Get All Analysis Results
```http
GET /api/analyses
```

### Get Uploaded Files
```http
GET /api/files?type=all|jd|resume
```

### Delete File
```http
DELETE /api/files/{fileId}
```

### Export Results
```http
GET /api/export/{analysisId}?format=json|csv
```

### Health Check
```http
GET /api/health
```

## Usage Guide

### 1. Upload Job Description
- Click on "Upload Job Description" section
- Select a PDF, DOCX, or TXT file containing the job description
- Ensure the JD includes skills, requirements, and qualifications
- Click "Upload"

### 2. Upload Resumes
- Select the uploaded Job Description
- Click on "Upload Resumes" section
- Select one or multiple candidate resumes (PDF, DOCX, TXT)
- Click "Upload & Analyze"

### 3. View Results
- Analysis results appear automatically after upload
- View relevance scores (High: 70+, Medium: 45-69, Low: 0-44)
- Check matched skills (green badges)
- Review missing skills (orange badges)
- See candidate location and experience

### 4. Export Results
- Click "Export JSON" for detailed data export
- Click "Export CSV" for spreadsheet-compatible format

## Scoring Algorithm

The system uses a weighted scoring algorithm:

- **Skills Match (60%)** - Most important factor
  - Compares technical skills between resume and JD
  - Supports 100+ technical skills across multiple domains
  
- **Experience (25%)** - Years of experience match
  - Exact match or higher: 25 points
  - 80% of required: 20 points
  - 60% of required: 15 points
  
- **Education (15%)** - Education level match
  - PhD/Doctorate: 5 points
  - Master's: 4 points
  - Bachelor's: 3 points
  - Diploma: 2 points

### Relevance Levels
- **High** (70-100): Strong match, recommend for interview
- **Medium** (45-69): Moderate match, consider for review
- **Low** (0-44): Limited match, may not be suitable

## Supported Skills

The system recognizes 100+ technical skills including:

**Languages:** Python, Java, JavaScript, TypeScript, C++, C#, Ruby, Go, PHP, Swift, Kotlin, Scala, R

**Frontend:** React, Angular, Vue.js, Next.js, Svelte, HTML, CSS, Tailwind, Bootstrap, Material-UI

**Backend:** Node.js, Express, Django, Flask, Spring Boot, FastAPI, Laravel, Rails, ASP.NET

**Cloud & DevOps:** AWS, Azure, GCP, Docker, Kubernetes, Jenkins, CI/CD, Terraform, Ansible

**Databases:** MongoDB, PostgreSQL, MySQL, Redis, Cassandra, DynamoDB, Elasticsearch, Oracle

**ML/AI:** Machine Learning, Deep Learning, TensorFlow, PyTorch, Keras, Pandas, NumPy

**Tools:** Git, GitHub, GitLab, Jira, Confluence

**Methodologies:** Agile, Scrum, Kanban, DevOps, TDD, BDD

## File Requirements

### Job Descriptions
- **Format:** PDF, DOCX, or TXT
- **Size:** Max 10MB
- **Content:** Must include job requirements, skills, qualifications
- **Keywords:** Should contain words like "responsibilities", "requirements", "qualifications"

### Resumes
- **Format:** PDF, DOCX, or TXT
- **Size:** Max 10MB per file
- **Content:** Must include experience, education, skills sections
- **Structure:** Should have clear sections for contact, experience, education, skills

## Project Structure

```
project/
├── backend/
│   ├── app/
│   │   └── main.py          # Flask API server
│   ├── uploads/
│   │   ├── jd/              # Job descriptions
│   │   └── resumes/         # Resume files
│   ├── venv/                # Virtual environment
│   └── requirements.txt     # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/
│   │   │       ├── upload-section.tsx
│   │   │       └── dashboard-preview.tsx
│   │   ├── services/
│   │   │   └── api.js       # API service layer
│   │   └── App.tsx
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

## Configuration

### Backend Configuration
Edit `backend/app/main.py`:

```python
UPLOAD_FOLDER = 'uploads'
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'}
```

### Frontend Configuration
Edit `frontend/src/services/api.js`:

```javascript
const API_BASE_URL = 'http://127.0.0.1:5000/api';
```

Or set environment variable:
```bash
VITE_API_URL=http://your-backend-url:5000/api
```

## Troubleshooting

### Backend Issues

**"ModuleNotFoundError: No module named 'PyPDF2'"**
```bash
pip install PyPDF2 python-docx flask flask-cors
```

**"Port 5000 already in use"**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

**"PDF extraction not available"**
```bash
pip install PyPDF2
```

### Frontend Issues

**"Failed to fetch"**
- Ensure backend is running on http://localhost:5000
- Check API_BASE_URL in api.js matches backend URL
- Verify CORS is enabled in backend

**"Import errors"**
```bash
npm install
# or
yarn install
```

## Best Practices

1. **Job Descriptions:**
   - Include 10-15 key technical skills
   - Specify required years of experience
   - Mention education requirements
   - Use clear, keyword-rich language

2. **Resumes:**
   - Ensure text is extractable (not scanned images)
   - Use standard section headings (Experience, Education, Skills)
   - Include years of experience explicitly
   - List technical skills clearly

3. **Analysis:**
   - Upload JD first, then resumes
   - Use batch analysis for multiple candidates
   - Review both matched and missing skills
   - Consider medium-relevance candidates for diverse skill sets

## Performance

- Processes up to 50 resumes per batch
- Average analysis time: ~2 seconds per resume
- Supports concurrent file uploads
- In-memory storage for fast retrieval

## Security

- File validation to prevent malicious uploads
- Size limits to prevent DoS attacks
- Secure file naming (UUID-based)
- No database credentials exposed
- CORS configured for specific origins

## Future Enhancements

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] User authentication and authorization
- [ ] Resume parsing with NLP
- [ ] Interview scheduling integration
- [ ] Ema