import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  BarChart3, 
  Users, 
  Briefcase, 
  Clock,
  Download,
  TrendingUp,
  Search,
  ArrowLeft,
  RefreshCw
} from "lucide-react";

interface CandidateDetail {
  resumeId: string;
  filename: string;
  score: number;
  relevance: string;
  analyzed_at: string;
  name?: string;
  experience?: string;
  location?: string;
  matchedSkills?: string[];
  missingSkills?: string[];
}

export default function DashboardPreview() {
  const [candidates, setCandidates] = useState<CandidateDetail[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateDetail[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRelevance, setFilterRelevance] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadCandidates();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filterRelevance, candidates]);

  const loadCandidates = async () => {
    if (candidates.length === 0) {
      setIsLoading(true);
    }
    
    try {
      const response = await fetch('http://127.0.0.1:5000/api/analyses');
      const data = await response.json();
      
      if (data.success && data.results) {
        const enrichedCandidates = data.results.map((result: any) => {
          const name = result.filename
            .replace(/\.(pdf|docx|txt)$/i, '')
            .replace(/[_-]/g, ' ')
            .split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');

          return {
            ...result,
            name,
            experience: result.experience || 'Not specified',
            location: result.location || 'Not specified',
            matchedSkills: result.matchedSkills || [],
            missingSkills: result.missingSkills || []
          };
        });
        setCandidates(enrichedCandidates);
      } else {
        setCandidates([]);
      }
    } catch (error) {
      console.error('Failed to load candidates:', error);
      setCandidates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadCandidates();
    setIsRefreshing(false);
  };

  const handleExport = () => {
    if (filteredCandidates.length === 0) {
      alert('No data to export');
      return;
    }

    // Create CSV content
    const headers = ['Name', 'Score', 'Relevance', 'Experience', 'Location', 'Matched Skills', 'Missing Skills'];
    const csvRows = [
      headers.join(','),
      ...filteredCandidates.map(candidate => [
        `"${candidate.name}"`,
        candidate.score,
        candidate.relevance,
        `"${candidate.experience}"`,
        `"${candidate.location}"`,
        `"${candidate.matchedSkills?.join('; ') || ''}"`,
        `"${candidate.missingSkills?.join('; ') || ''}"`
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidate-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const applyFilters = () => {
    let filtered = [...candidates];

    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.matchedSkills?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (filterRelevance !== 'all') {
      filtered = filtered.filter(c => 
        c.relevance.toLowerCase() === filterRelevance.toLowerCase()
      );
    }

    filtered.sort((a, b) => b.score - a.score);
    setFilteredCandidates(filtered);
  };

  const getRelevanceBadgeClass = (relevance: string) => {
    switch (relevance.toLowerCase()) {
      case 'high': return 'bg-emerald-500 text-white hover:bg-emerald-600';
      case 'medium': return 'bg-amber-500 text-white hover:bg-amber-600';
      case 'low': return 'bg-rose-500 text-white hover:bg-rose-600';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 45) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const totalCandidates = candidates.length;
  const highRelevance = candidates.filter(c => c.relevance === 'High').length;
  const jobsPosted = Math.floor(totalCandidates / 15) || 1;

  return (
    <section className="min-h-screen py-12 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6 gap-2"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-gray-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 bg-clip-text text-transparent leading-tight mb-1">Total Candidates</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 bg-clip-text text-transparent leading-tight">{totalCandidates}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-gray-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 bg-clip-text text-transparent leading-tight mb-1">High Relevance</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 bg-clip-text text-transparent leading-tight">{highRelevance}</p>
                </div>
                <div className="w-12 h-12 bg-gary-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-gray-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 bg-clip-text text-transparent leading-tightmb-1">Jobs Posted</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 bg-clip-text text-transparent leading-tight">{jobsPosted}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-gray-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 bg-clip-text text-transparent leading-tight mb-1">Avg Processing</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 bg-clip-text text-transparent leading-tight">2.1s</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="border-b bg-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-10 h-10 bg-gradient-to-r from-gray-600 via-white-600 to-black-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-gray" />
                </div>
                <h2 className="bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 bg-clip-text text-transparent leading-tight">Candidate Analysis Results</h2>
              </CardTitle>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  className="gap-2 " 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button 
                  className="gap-2 bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 hover:from-gray-700 hover:via-white-600 hover:to-black-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all group"
                  onClick={handleExport}
                  disabled={filteredCandidates.length === 0}
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select 
                value={filterRelevance} 
                onChange={(e) => setFilterRelevance(e.target.value)}
                className="border rounded-lg px-4 py-2 bg-white min-w-[140px]"
              >
                <option value="all">All Levels</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading candidates...</p>
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Analysis Results Yet</h3>
                <p className="text-gray-500 mb-4">
                  Upload job descriptions and resumes to see analysis results
                </p>
                <Button onClick={() => window.location.href = '/upload'} className="bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 hover:from-gray-700 hover:via-white-600 hover:to-black-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all group">
                  Get Started
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCandidates.map((candidate, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow border-l-4" 
                        style={{ borderLeftColor: candidate.score >= 70 ? '#10b981' : candidate.score >= 45 ? '#f59e0b' : '#ef4444' }}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                              {candidate.name?.charAt(0) || 'C'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 bg-clip-text text-transparent leading-tight">{candidate.name}</h3>
                                <Badge className={getRelevanceBadgeClass(candidate.relevance)}>
                                  {candidate.relevance}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 bg-clip-text text-transparent leading-tight mb-3">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {candidate.experience}
                                </span>
                                <span>📍 {candidate.location}</span>
                              </div>

                              {candidate.matchedSkills && candidate.matchedSkills.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-sm font-semibold bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 bg-clip-text text-transparent leading-tightmb-2">
                                    Matched Skills ({candidate.matchedSkills.length})
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {candidate.matchedSkills.map((skill, i) => (
                                      <Badge key={i} variant="outline" className="bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 bg-clip-text text-transparent leading-tight">
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {candidate.missingSkills && candidate.missingSkills.length > 0 && (
                                <div>
                                  <p className="text-sm font-semibold bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 bg-clip-text text-transparent leading-tight mb-2">
                                    Missing Skills ({candidate.missingSkills.length})
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {candidate.missingSkills.map((skill, i) => (
                                      <Badge key={i} variant="outline" className="bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 bg-clip-text text-transparent leading-tight">
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-5xl font-bold mb-2" 
                               style={{ color: candidate.score >= 70 ? '#10b981' : candidate.score >= 45 ? '#f59e0b' : '#ef4444' }}>
                            {candidate.score}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">Relevance Score</p>
                          <div className="w-32">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 ${getScoreBarColor(candidate.score)}`}
                                style={{ width: `${candidate.score}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}