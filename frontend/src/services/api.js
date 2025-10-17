// src/services/api.js - FOR FLASK BACKEND
const API_BASE_URL = 'http://127.0.0.1:5000/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.detail || errorMessage;
    } catch (e) {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

// Upload files (Job Description or Resumes)
export const uploadFiles = async (files, type = 'jd') => {
  try {
    const formData = new FormData();
    
    // Add all files to FormData
    if (Array.isArray(files)) {
      files.forEach(file => formData.append('files', file));
    } else {
      formData.append('files', files);
    }
    
    // Add type (jd or resume)
    formData.append('type', type);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    const result = await handleResponse(response);
    return {
      success: true,
      data: result.data,
      message: result.message || 'Files uploaded successfully'
    };
  } catch (error) {
    console.error('Error uploading files:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to upload files'
    };
  }
};

// Upload single Job Description
export const uploadJobDescription = async (file) => {
  return uploadFiles([file], 'jd');
};

// Upload single Resume
export const uploadResume = async (file) => {
  return uploadFiles([file], 'resume');
};

// Analyze resumes against job description
export const analyzeResumes = async (jobDescriptionId, resumeIds) => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobDescriptionId: jobDescriptionId,
        resumeIds: resumeIds,
      }),
    });

    const result = await handleResponse(response);
    return {
      success: true,
      data: result.data,
      results: result.results || result.data?.results || [],
      message: result.message || 'Analysis completed successfully'
    };
  } catch (error) {
    console.error('Error analyzing resumes:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to analyze data'
    };
  }
};

// Get all uploaded files
export const getUploadedFiles = async (type = 'all') => {
  try {
    const response = await fetch(`${API_BASE_URL}/files?type=${type}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const result = await handleResponse(response);
    return result.files || [];
  } catch (error) {
    console.error('Error fetching files:', error);
    return [];
  }
};

// Get job descriptions
export const getJobDescriptions = async () => {
  try {
    const files = await getUploadedFiles('jd');
    return files;
  } catch (error) {
    console.error('Error fetching job descriptions:', error);
    return [];
  }
};

// Get all resumes
export const getAllResumes = async () => {
  try {
    const files = await getUploadedFiles('resume');
    return files;
  } catch (error) {
    console.error('Error fetching resumes:', error);
    return [];
  }
};

// Get analysis results
export const getAnalysisResults = async (analysisId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/analysis/${analysisId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const result = await handleResponse(response);
    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete file
export const deleteFile = async (fileId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    await handleResponse(response);
    return {
      success: true,
      message: 'File deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting file:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Health check
export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

// Export results
export const exportResults = async (analysisId, format = 'json') => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/export/${analysisId}?format=${format}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    return {
      success: true,
      blob: blob,
      filename: `analysis_${analysisId}.${format}`
    };
  } catch (error) {
    console.error('Export error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  uploadFiles,
  uploadJobDescription,
  uploadResume,
  analyzeResumes,
  getUploadedFiles,
  getJobDescriptions,
  getAllResumes,
  getAnalysisResults,
  deleteFile,
  checkHealth,
  exportResults,
};