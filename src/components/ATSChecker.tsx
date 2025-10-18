import React, { useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, CheckCircle, Upload, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { ATSResult } from '../types';

interface ATSCheckerProps {
  onBack: () => void;
}

export const ATSChecker: React.FC<ATSCheckerProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [atsResult, setATSResult] = useState<ATSResult | null>(null);

  const analyzeResume = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      alert('Please provide both resume content and job description');
      return;
    }

    setIsAnalyzing(true);
    
    // Mock ATS analysis - replace with actual OpenAI API call
    setTimeout(() => {
      const mockResult: ATSResult = {
        score: Math.floor(Math.random() * 40) + 60, // Random score between 60-100
        missing_keywords: [
          'React',
          'Node.js',
          'AWS',
          'Agile methodology',
          'Unit testing',
          'REST API'
        ],
        suggested_improvements: [
          'Add specific metrics to quantify your achievements (e.g., "Improved performance by 40%")',
          'Include more technical keywords mentioned in the job description',
          'Add a professional summary section at the top of your resume',
          'Use bullet points to improve readability and ATS parsing',
          'Include relevant certifications or training programs',
          'Mention specific tools and technologies used in projects',
          'Add keywords related to the industry and role requirements',
          'Include soft skills that are mentioned in the job posting'
        ]
      };
      
      setATSResult(mockResult);
      setIsAnalyzing(false);
    }, 3000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 60) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-bold text-gray-900">ATS Resume Checker</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={user.plan === 'paid' ? 'default' : 'secondary'}>
              {user.plan === 'paid' ? 'Premium' : 'Free Plan'}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resume Content</CardTitle>
                <CardDescription>
                  Paste your resume text or upload a file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="resume-text">Resume Text</Label>
                  <Textarea
                    id="resume-text"
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste your resume content here..."
                    rows={10}
                  />
                </div>
                
                <div className="text-center">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-2">Or upload your resume file</p>
                    <Button variant="outline" size="sm" disabled>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload PDF/DOC (Coming Soon)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
                <CardDescription>
                  Paste the complete job posting for accurate analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="job-description">Job Description</Label>
                  <Textarea
                    id="job-description"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here..."
                    rows={8}
                  />
                </div>
              </CardContent>
            </Card>

            <Button 
              className="w-full" 
              onClick={analyzeResume}
              disabled={isAnalyzing || !resumeText.trim() || !jobDescription.trim()}
            >
              <Target className="h-4 w-4 mr-2" />
              {isAnalyzing ? 'Analyzing Resume...' : 'Check ATS Compatibility'}
            </Button>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {isAnalyzing ? (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <h3 className="text-lg font-semibold mb-2">Analyzing Your Resume</h3>
                    <p className="text-gray-600">
                      Our AI is comparing your resume against the job requirements...
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : atsResult ? (
              <>
                {/* ATS Score */}
                <Card className={getScoreBackground(atsResult.score)}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      ATS Compatibility Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className={`text-4xl font-bold mb-2 ${getScoreColor(atsResult.score)}`}>
                        {atsResult.score}/100
                      </div>
                      <Progress value={atsResult.score} className="mb-4" />
                      <p className="text-sm text-gray-600">
                        {atsResult.score >= 80 ? 'Excellent! Your resume is well-optimized for ATS systems.' :
                         atsResult.score >= 60 ? 'Good score, but there\'s room for improvement.' :
                         'Your resume needs optimization to pass ATS screening.'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Missing Keywords */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                      Missing Keywords
                    </CardTitle>
                    <CardDescription>
                      Important terms from the job description not found in your resume
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {atsResult.missing_keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="mr-2 mb-2">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                    {atsResult.missing_keywords.length === 0 && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Great! All important keywords are present.</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Improvement Suggestions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      Improvement Suggestions
                    </CardTitle>
                    <CardDescription>
                      Actionable recommendations to boost your ATS score
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {atsResult.suggested_improvements.map((suggestion, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                          </div>
                          <p className="text-sm text-gray-700">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button className="flex-1" onClick={() => setATSResult(null)}>
                    Check Another Resume
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Export Report
                  </Button>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Target className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">ATS Analysis Results</h3>
                  <p className="text-gray-600">
                    Provide your resume content and job description to get started with the ATS compatibility analysis.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* How it Works */}
            <Card>
              <CardHeader>
                <CardTitle>How ATS Checking Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>AI analyzes keyword matching between your resume and job description</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Checks for proper formatting and structure that ATS systems prefer</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Identifies missing skills and qualifications from job requirements</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Provides actionable suggestions to improve your score</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};