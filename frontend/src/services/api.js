// src/services/api.js - DIAGNOSTIC VERSION
// This version includes extensive logging to help debug the upload issue

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://ai-resume-backend-os6v.onrender.com";

console.log("🔗 API_BASE_URL:", API_BASE_URL);
console.log("🔗 Environment:", import.meta.env.VITE_API_URL);

// Wake up the backend
export const wakeUpBackend = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
    });
    const data = await response.json();
    console.log('✅ Backend is awake:', data);
    return true;
  } catch (error) {
    console.log('⏰ Backend may be sleeping, waiting...');
    return false;
  }
};

// Auto wake-up on import
wakeUpBackend();

// Upload files with extensive debugging
export const uploadFiles = async (files, type = 'resume') => {
  console.group('📤 UPLOAD DEBUG');
  console.log('═══════════════════════════════════════');
  
  // Log what we received
  console.log('Type parameter:', type);
  console.log('Files parameter type:', files?.constructor?.name);
  console.log('Is Array:', Array.isArray(files));
  console.log('Number of files:', files?.length);
  
  // Log each file's details
  if (files && files.length > 0) {
    console.log('\n📋 File Details:');
    Array.from(files).forEach((file, index) => {
      console.log(`\nFile ${index + 1}:`, {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        sizeBytes: file.size,
        lastModified: new Date(file.lastModified).toLocaleString(),
        isFile: file instanceof File,
        isBlob: file instanceof Blob,
      });
      
      // Check for common issues
      if (!file.type) {
        console.warn('⚠️ File has no MIME type!');
      }
      if (file.size === 0) {
        console.warn('⚠️ File is empty (0 bytes)!');
      }
      if (file.size > 10 * 1024 * 1024) {
        console.warn('⚠️ File is larger than 10MB!');
      }
    });
  } else {
    console.error('❌ No files provided or files is empty/null');
    console.groupEnd();
    return { 
      success: false, 
      error: 'No files provided',
      message: 'Please select at least one file to upload'
    };
  }
  
  // Create FormData
  const formData = new FormData();
  
  try {
    // Convert to array if needed
    const filesArray = Array.isArray(files) ? files : Array.from(files);
    
    console.log('\n📦 Building FormData...');
    
    // Append each file
    filesArray.forEach((file, index) => {
      console.log(`Adding file ${index + 1}: ${file.name}`);
      formData.append('files', file, file.name); // Include filename explicitly
    });
    
    // Append type
    formData.append('type', type);
    console.log(`Adding type: ${type}`);
    
    // Log FormData contents
    console.log('\n📋 FormData Contents:');
    let formDataCount = 0;
    for (let [key, value] of formData.entries()) {
      formDataCount++;
      if (value instanceof File) {
        console.log(`  ${key}:`, {
          filename: value.name,
          type: value.type,
          size: `${(value.size / 1024).toFixed(2)} KB`
        });
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }
    console.log(`Total FormData entries: ${formDataCount}`);
    
    // Make the request
    console.log('\n🚀 Sending Upload Request...');
    console.log('URL:', `${API_BASE_URL}/api/upload`);
    console.log('Method: POST');
    console.log('Body: FormData');
    
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
      // DO NOT set Content-Type - browser will set it with boundary
    });

    console.log('\n📥 Response Received:');
    console.log('Status:', response.status, response.statusText);
    console.log('OK:', response.ok);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    // Get response text first
    const responseText = await response.text();
    console.log('Response body (raw):', responseText);
    
    if (!response.ok) {
      console.error('❌ Upload Failed!');
      
      let errorMessage = 'Upload failed';
      let errorDetails = null;
      
      try {
        errorDetails = JSON.parse(responseText);
        errorMessage = errorDetails.error || errorDetails.message || errorMessage;
        console.error('Error details:', errorDetails);
      } catch (e) {
        errorMessage = responseText || `HTTP ${response.status}: ${response.statusText}`;
        console.error('Could not parse error response:', e);
      }
      
      console.log('═══════════════════════════════════════');
      console.groupEnd();
      
      return { 
        success: false, 
        error: errorMessage,
        details: errorDetails,
        status: response.status
      };
    }

    // Parse successful response
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('✅ Upload Successful!');
      console.log('Response data:', data);
    } catch (e) {
      console.error('⚠️ Could not parse success response:', e);
      data = { message: responseText };
    }
    
    console.log('═══════════════════════════════════════');
    console.groupEnd();
    
    return { 
      success: true, 
      data,
      message: data.message || 'Files uploaded successfully'
    };
    
  } catch (error) {
    console.error('❌ Upload Error (Exception):');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    console.log('═══════════════════════════════════════');
    console.groupEnd();
    
    return { 
      success: false, 
      error: error.message,
      exception: error
    };
  }
};

// Get uploaded files
export const getUploadedFiles = async (type = 'all') => {
  try {
    console.log(`📁 Fetching files (type: ${type})...`);
    const response = await fetch(`${API_BASE_URL}/api/files?type=${type}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Fetched ${data.files?.length || 0} files`);
    
    // Return files array directly for easier consumption
    return data.files || [];
  } catch (error) {
    console.error('❌ Get files error:', error);
    throw error;
  }
};

// Delete a file
export const deleteFile = async (fileId, fileType) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/files/${fileId}?type=${fileType}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Delete file error:', error);
    return { success: false, error: error.message };
  }
};

// Analyze resumes
export const analyzeResumes = async (jobDescriptionId, resumeIds) => {
  try {
    console.log('🔍 Starting analysis...');
    console.log('Job Description ID:', jobDescriptionId);
    console.log('Resume IDs:', resumeIds);
    
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job_description_id: jobDescriptionId,
        resume_ids: resumeIds,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Analysis complete:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Analyze error:', error);
    return { success: false, error: error.message };
  }
};

// Export results
export const exportResults = async (analysisId, format = 'json') => {
  try {
    console.log(`📥 Exporting results (${format})...`);
    const response = await fetch(
      `${API_BASE_URL}/api/export/${analysisId}?format=${format}`,
      {
        method: 'GET',
        headers: {
          'Accept': format === 'json' ? 'application/json' : 
                   format === 'csv' ? 'text/csv' : 'application/pdf'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const filename = `resume-analysis-${analysisId}.${format}`;
    
    console.log('✅ Export successful');
    return { 
      success: true, 
      blob,
      filename 
    };
  } catch (error) {
    console.error('❌ Export error:', error);
    return { success: false, error: error.message };
  }
};

// Health check
export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
    });

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default {
  wakeUpBackend,
  uploadFiles,
  getUploadedFiles,
  deleteFile,
  analyzeResumes,
  exportResults,
  checkHealth,
};