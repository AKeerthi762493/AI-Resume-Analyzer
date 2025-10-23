import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Upload, 
  FileText, 
  Briefcase, 
  CheckCircle, 
  Download,
  Eye,
  X,
  Loader2,
  TrendingUp,
  Award,
  Clock,
  ArrowLeft
} from "lucide-react";
import * as api from "../../services/api";

interface FileData {
  id: string;
  filename: string;
  type: string;
  uploaded_at: string;
  size: number;
}

interface AnalysisResult {
  resumeId: string;
  filename: string;
  score: number;
  relevance: string;
  analyzed_at: string;
}

export function UploadSection() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobDescriptions, setJobDescriptions] = useState<FileData[]>([]);
  const [resumes, setResumes] = useState<FileData[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [uploadedJdFiles, setUploadedJdFiles] = useState<File[]>([]);
  const [uploadedResumeFiles, setUploadedResumeFiles] = useState<File[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);
  
  const jdFileInputRef = useRef<HTMLInputElement>(null);
  const resumeFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const loadFiles = async () => {
    try {
      const files = await api.getUploadedFiles('all');
      const jdFiles = files.filter((f: FileData) => f.type === 'jd');
      const resumeFiles = files.filter((f: FileData) => f.type === 'resume');
      setJobDescriptions(jdFiles);
      setResumes(resumeFiles);
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const handleJdFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const validFiles = files.filter(file => allowedTypes.includes(file.type));
    
    if (validFiles.length !== files.length) {
      showMessage('error', 'Some files rejected. Only PDF, DOCX, and TXT files are supported');
    }
    
    setUploadedJdFiles(validFiles);
  };

  const handleResumeFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const validFiles = files.filter(file => allowedTypes.includes(file.type));
    
    if (validFiles.length !== files.length) {
      showMessage('error', 'Some files rejected. Only PDF, DOCX, and TXT files are supported');
    }
    
    setUploadedResumeFiles(prev => [...prev, ...validFiles]);
  };

  const uploadJobDescriptions = async () => {
    if (uploadedJdFiles.length === 0) {
      showMessage('error', 'Please select job description files');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await api.uploadFiles(uploadedJdFiles, 'jd');
      
      if (result.success) {
        showMessage('success', result.message);
        setUploadedJdFiles([]);
        if (jdFileInputRef.current) {
          jdFileInputRef.current.value = '';
        }
        await loadFiles();
      } else {
        showMessage('error', result.error || 'Upload failed');
      }
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadResumesAction = async () => {
    if (uploadedResumeFiles.length === 0) {
      showMessage('error', 'Please select resume files');
      return;
    }

    if (!selectedJobId) {
      showMessage('error', 'Please select a job description first');
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);
    
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 70));
      }, 200);

      const result = await api.uploadFiles(uploadedResumeFiles, 'resume');
      
      clearInterval(progressInterval);
      setUploadProgress(80);

      if (result.success) {
        showMessage('success', 'Resumes uploaded. Starting analysis...');
        setUploadedResumeFiles([]);
        if (resumeFileInputRef.current) {
          resumeFileInputRef.current.value = '';
        }
        await loadFiles();
        
        setUploadProgress(90);
        if (result.data && result.data.fileIds) {
          await analyzeUploadedResumes(result.data.fileIds);
        }
        setUploadProgress(100);
      } else {
        showMessage('error', result.error || 'Upload failed');
      }
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const analyzeUploadedResumes = async (resumeIds: string[]) => {
    if (!selectedJobId) {
      showMessage('error', 'No job description selected');
      return;
    }

    try {
      const result = await api.analyzeResumes(selectedJobId, resumeIds);
      
      if (result.success) {
        setCurrentAnalysisId(result.data.analysisId);
        setAnalysisResults(result.data.results);
        showMessage('success', `Analysis completed! ${result.data.results.length} resumes analyzed`);
      } else {
        showMessage('error', result.error || 'Analysis failed');
      }
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Analysis failed');
    }
  };

  const handleAnalyzeAll = async () => {
    if (!selectedJobId) {
      showMessage('error', 'Please select a job description first');
      return;
    }

    const resumeIds = resumes.map(r => r.id);
    if (resumeIds.length === 0) {
      showMessage('error', 'No resumes available to analyze');
      return;
    }

    setIsProcessing(true);
    await analyzeUploadedResumes(resumeIds);
    setIsProcessing(false);
  };

  const handleExport = async (format: 'json' | 'csv') => {
    if (!currentAnalysisId) {
      showMessage('error', 'No analysis results to export');
      return;
    }

    try {
      // ✅ FIXED: Use api.exportResults instead of hardcoded localhost
      const result = await api.exportResults(currentAnalysisId, format);
      
      if (result.success && result.blob) {
        const url = window.URL.createObjectURL(result.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename || `analysis_${currentAnalysisId}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        showMessage('success', `Results exported as ${format.toUpperCase()}`);
      } else {
        // If backend fails, fallback to local generation
        console.warn('Backend export failed, generating file locally');
        generateLocalExport(format);
      }
    } catch (error) {
      console.error('Export error:', error);
      // Fallback to local generation
      generateLocalExport(format);
    }
  };

  const generateLocalExport = (format: 'json' | 'csv') => {
    try {
      let content: string;
      let mimeType: string;
      
      if (format === 'json') {
        // Generate JSON
        const exportData = {
          analysisId: currentAnalysisId,
          exportedAt: new Date().toISOString(),
          totalResumes: analysisResults.length,
          averageScore: Math.round(analysisResults.reduce((sum, r) => sum + r.score, 0) / analysisResults.length),
          highMatchCount: analysisResults.filter(r => r.relevance === 'High').length,
          mediumMatchCount: analysisResults.filter(r => r.relevance === 'Medium').length,
          lowMatchCount: analysisResults.filter(r => r.relevance === 'Low').length,
          results: analysisResults.map(result => ({
            resumeId: result.resumeId,
            filename: result.filename,
            score: result.score,
            relevance: result.relevance,
            analyzedAt: result.analyzed_at
          }))
        };
        
        content = JSON.stringify(exportData, null, 2);
        mimeType = 'application/json';
        
      } else {
        // Generate CSV
        const headers = ['Resume ID', 'Filename', 'Score', 'Relevance', 'Analyzed At'];
        const rows = analysisResults.map(result => [
          result.resumeId,
          `"${result.filename.replace(/"/g, '""')}"`, // Escape quotes in filename
          result.score,
          result.relevance,
          new Date(result.analyzed_at).toLocaleString()
        ]);
        
        content = [
          headers.join(','),
          ...rows.map(row => row.join(','))
        ].join('\n');
        
        mimeType = 'text/csv';
      }
      
      // Create and download the file
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis_results_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      showMessage('success', `Results exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Local export error:', error);
      showMessage('error', 'Failed to generate export file');
    }
  };

  const handleViewDetails = () => {
    if (analysisResults.length > 0) {
      setShowDetailsModal(true);
    } else {
      showMessage('error', 'No analysis results to view');
    }
  };

  const handleViewSingleResult = (result: AnalysisResult) => {
    setSelectedResult(result);
    setShowDetailsModal(true);
  };

  const removeResumeFile = (index: number) => {
    setUploadedResumeFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getScoreBadgeClass = (relevance: string) => {
    switch (relevance.toLowerCase()) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-6 gap-2"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 bg-clip-text text-transparent leading-tight">Upload & Analyze</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your job descriptions and resumes to get instant analysis with detailed relevance scores.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* JD Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 ">
                <Briefcase className="w-5 h-5 " />
                <h3 className="bg-gradient-to-r from-gray-600 via-white-400 to-balck-600 bg-clip-text text-transparent leading-tight">Upload Job Description</h3>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer" onClick={() => jdFileInputRef.current?.click()}>
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <h3 className="font-semibold mb-2">Drop JD files here</h3>
                <p className="text-sm text-muted-foreground mb-4">PDF, DOCX, TXT</p>
                <Button variant="outline">Browse Files</Button>
              </div>
              
              <input ref={jdFileInputRef} type="file" accept=".pdf,.docx,.txt" multiple onChange={handleJdFileSelect} className="hidden" />

              {uploadedJdFiles.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Selected: {uploadedJdFiles.length} file(s)</span>
                    <Button size="sm" onClick={uploadJobDescriptions} disabled={isProcessing}>
                      {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading</> : 'Upload'}
                    </Button>
                  </div>
                </div>
              )}
              
              {jobDescriptions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Available Jobs:</h4>
                  {jobDescriptions.map((jd) => (
                    <div 
                      key={jd.id}
                      className={`flex items-center gap-2 p-3 rounded border cursor-pointer ${selectedJobId === jd.id ? 'bg-primary/10 border-primary' : 'hover:bg-gray-50'}`}
                      onClick={() => setSelectedJobId(jd.id)}
                    >
                      <Briefcase className="w-4 h-4" />
                      <span className="flex-1 text-sm truncate">{jd.filename}</span>
                      {selectedJobId === jd.id && <CheckCircle className="w-4 h-4 text-primary" />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resume Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <FileText className="w-5 h-5" />
                <h2 className="bg-gradient-to-r from-gray-600 via-white-400 to-balck-600 bg-clip-text text-transparent leading-tight">Upload Resumes</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer" onClick={() => resumeFileInputRef.current?.click()}>
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <h3 className="font-semibold mb-2">Drop resume files</h3>
                <p className="text-sm text-muted-foreground mb-4">Multiple files supported</p>
                <Button variant="outline" disabled={!selectedJobId}>{selectedJobId ? 'Browse Files' : 'Select Job First'}</Button>
              </div>
              
              <input ref={resumeFileInputRef} type="file" accept=".pdf,.docx,.txt" multiple onChange={handleResumeFileSelect} className="hidden" />
              
              {isProcessing && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
              
              {uploadedResumeFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Files: {uploadedResumeFiles.length}</span>
                    <Button size="sm" onClick={uploadResumesAction} disabled={isProcessing || !selectedJobId}>
                      {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading</> : 'Upload & Analyze'}
                    </Button>
                  </div>
                  {uploadedResumeFiles.slice(0, 3).map((file, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                      <FileText className="w-4 h-4" />
                      <span className="flex-1 truncate">{file.name}</span>
                      <X className="w-4 h-4 cursor-pointer" onClick={() => removeResumeFile(i)} />
                    </div>
                  ))}
                </div>
              )}

              {resumes.length > 0 && selectedJobId && (
                <Button className="w-full bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 hover:from-gray-700 hover:via-white-600 hover:to-black-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all group" onClick={handleAnalyzeAll} disabled={isProcessing} >
                  {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing</> : `Analyze All (${resumes.length})`}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {analysisResults.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5" />
                <h3 className="bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 bg-clip-text text-transparent leading-tight">Analysis Results</h3>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 bg-clip-text text-transparent leading-tight">{analysisResults.length}</div>
                  <div className="text-sm text-muted-foreground">Analyzed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 bg-clip-text text-transparent leading-tight">{analysisResults.filter(r => r.relevance === 'High').length}</div>
                  <div className="text-sm text-muted-foreground">High Match</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 bg-clip-text text-transparent leading-tight">{Math.round(analysisResults.reduce((sum, r) => sum + r.score, 0) / analysisResults.length)}</div>
                  <div className="text-sm text-muted-foreground">Avg Score</div>
                </div>
              </div>
              
              <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
                {analysisResults.sort((a, b) => b.score - a.score).map((result, i) => (
                  <div 
                    key={i} 
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => handleViewSingleResult(result)}
                  >
                    <FileText className="w-5 h-5" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{result.filename}</div>
                      <div className="text-xs text-gray-500">Score: {result.score}/100</div>
                    </div>
                    <Badge className={getScoreBadgeClass(result.relevance)}>{result.relevance}</Badge>
                    <Eye className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
              
              <div className="flex gap-3 justify-center">
                <Button onClick={handleViewDetails} className="bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 hover:from-gray-700 hover:via-white-600 hover:to-black-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all group">
                  <Eye className="w-4 h-4 mr-2 " />View All Details
                </Button>
                <Button variant="outline" onClick={() => handleExport('json')}>
                  <Download className="w-4 h-4 mr-2" />Export JSON
                </Button>
                <Button variant="outline" onClick={() => handleExport('csv')}>
                  <Download className="w-4 h-4 mr-2" />Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Details Modal */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                {selectedResult ? `Resume Details: ${selectedResult.filename}` : 'Analysis Details'}
              </DialogTitle>
              <DialogDescription>
                Detailed analysis results and scoring breakdown
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {selectedResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Overall Score</p>
                            <p className={`text-3xl font-bold ${getScoreColor(selectedResult.score)}`}>
                              {selectedResult.score}/100
                            </p>
                          </div>
                          <TrendingUp className={`w-8 h-8 ${getScoreColor(selectedResult.score)}`} />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Relevance Level</p>
                            <Badge className={`${getScoreBadgeClass(selectedResult.relevance)} text-lg px-3 py-1 mt-2`}>
                              {selectedResult.relevance}
                            </Badge>
                          </div>
                          <Award className="w-8 h-8 text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Analyzed: {new Date(selectedResult.analyzed_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Filename:</span>
                          <span className="font-medium">{selectedResult.filename}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Resume ID:</span>
                          <span className="font-mono text-xs">{selectedResult.resumeId}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Recommendation</h4>
                    <p className="text-sm text-blue-800">
                      {selectedResult.relevance === 'High' 
                        ? 'This candidate shows strong alignment with the job requirements. Recommended for interview.'
                        : selectedResult.relevance === 'Medium'
                        ? 'This candidate shows moderate alignment. Consider for further review.'
                        : 'This candidate shows limited alignment with job requirements. May not be the best fit.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-2xl font-bold bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 bg-clip-text text-transparent leading-tight">{analysisResults.length}</p>
                        <p className="text-sm text-muted-foreground">Total Analyzed</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-2xl font-bold bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 bg-clip-text text-transparent leading-tight">
                          {analysisResults.filter(r => r.relevance === 'High').length}
                        </p>
                        <p className="text-sm text-muted-foreground">High Match</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-2xl font-bold bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 bg-clip-text text-transparent leading-tight">
                          {Math.round(analysisResults.reduce((sum, r) => sum + r.score, 0) / analysisResults.length)}
                        </p>
                        <p className="text-sm text-muted-foreground">Average Score</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    <h4 className="font-semibold mb-3">Top Candidates (Sorted by Score)</h4>
                    {analysisResults.sort((a, b) => b.score - a.score).map((result, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center font-semibold text-sm">
                            #{i + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{result.filename}</p>
                            <p className="text-xs text-muted-foreground">Score: {result.score}/100</p>
                          </div>
                        </div>
                        <Badge className={getScoreBadgeClass(result.relevance)}>
                          {result.relevance}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => {
                setShowDetailsModal(false);
                setSelectedResult(null);
              }}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}