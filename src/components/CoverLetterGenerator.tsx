import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Wand2, Download, Save, Crown, Lock } from 'lucide-react';
import logo from '../assets/Generated Image November 18, 2025 - 5_26PM.png';

interface CoverLetterGeneratorProps {
  onBack: () => void;
}

export const CoverLetterGenerator: React.FC<CoverLetterGeneratorProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [generatedLetter, setGeneratedLetter] = useState('');

  // ✅ FIXED: move fetch inside async function
 const generateCoverLetter = async () => {
  console.log("🚀 [CLIENT] generateCoverLetter() called");

   if (user?.plan === "free") {
    alert("Cover Letter generation is a premium feature. Please upgrade to access this tool.");
    return;
  }

  try {
    setIsGenerating(true);

    const profile = {
      name: user?.full_name || "Your Name",
      email: user?.email || "your.email@example.com",
    };

    const company = companyName || "Unknown Company";
    const points = jobDescription || "";

    console.log("📦 [CLIENT] Sending Request Body:", { profile, company, job_title: jobTitle, points });

    const res = await fetch('https://resumize-backend.vercel.app/api/generate/cover-letter', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
  profile,
  company,
  jobTitle,        // ✅ matches backend variable name
  jobDescription: points, // ✅ matches backend variable name
}),

    });

    console.log("📡 [CLIENT] Raw Response Object:", res);

    const json = await res.json();
    console.log("📨 [CLIENT] Parsed JSON Response:", json);

    if (json.cover_letter) {
  console.log("✅ [CLIENT] Success - Cover letter received");
  setGeneratedLetter(json.cover_letter);
} else {
  console.warn("⚠️ [CLIENT] No cover letter found in response:", json);
  alert("Error generating cover letter. Please try again.");
}

  } catch (error) {
    console.error("❌ [CLIENT] Exception during generation:", error);
    alert("An error occurred while generating the cover letter.");
  } finally {
    setIsGenerating(false);
    console.log("🧩 [CLIENT] Generation process ended");
  }
};


  const saveCoverLetter = () => {
    if (user?.plan === 'free') {
      alert('Saving cover letters is a premium feature. Please upgrade to access this functionality.');
      return;
    }
    alert('Cover letter saved successfully!');
  };

 const exportPDF = () => {
  
  if (!generatedLetter || generatedLetter.trim().length === 0) {
    alert('No cover letter available to copy.');
    return;
  }

  navigator.clipboard.writeText(generatedLetter)
    .then(() => {
      alert('Cover letter copied to clipboard!');
    })
    .catch((err) => {
      console.error('Failed to copy:', err);
      alert('Failed to copy the cover letter.');
    });
};

  if (!user) return null;


  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/50 via-white to-green-50/50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-pink-50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="flex items-center gap-2">
              <img src={logo} alt="Resuma Builder" className="h-6 w-6" />
              <h1 className="text-lg font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-green-600 bg-clip-text text-transparent">Cover Letter Generator</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={user.plan === 'paid' ? 'default' : 'secondary'}
              className={user.plan === 'paid' ? 'bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 text-white border-0' : ''}
            >
              {user.plan === 'paid' ? 'Premium' : 'Free'}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {user.plan === 'free' ? (
          /* Premium Feature Lock */
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                    <Crown className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Premium Feature</h2>
                  <p className="text-gray-600">
                    Cover Letter Generator is available for premium users only. 
                    Upgrade now to create personalized, AI-powered cover letters.
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <Lock className="h-5 w-5 text-gray-400" />
                    <span className="text-left">AI-powered personalized cover letters</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <Lock className="h-5 w-5 text-gray-400" />
                    <span className="text-left">Job-specific content generation</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <Lock className="h-5 w-5 text-gray-400" />
                    <span className="text-left">Editable and downloadable letters</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <Lock className="h-5 w-5 text-gray-400" />
                    <span className="text-left">Professional formatting and templates</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border-2 border-indigo-200 mb-6">
                  <p className="text-lg font-semibold text-indigo-900 mb-2">
                    Upgrade to Premium for just PKR 2,999
                  </p>
                  <p className="text-indigo-700">
                    Get unlimited access to all AI-powered tools and premium features
                  </p>
                </div>

                <Button 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <Crown className="h-5 w-5 mr-2" />
                  Upgrade to Premium
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Premium User Interface */
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Job Information</CardTitle>
                  <CardDescription>
                    Provide details about the job you're applying for
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="job-title">Job Title</Label>
                    <Input
                      id="job-title"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g., Senior Software Engineer"
                    />
                  </div>

                  

                  <div>
                    <Label htmlFor="job-description">Job Description</Label>
                    <Textarea
                      id="job-description"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the job description here for more personalized content..."
                      rows={8}
                    />
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={generateCoverLetter}
                    disabled={isGenerating || !jobTitle.trim()}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    {isGenerating ? 'Generating Cover Letter...' : 'Generate Cover Letter'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Include the complete job description for better personalization</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>The AI will align your resume experience with job requirements</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Review and customize the generated content before submitting</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Save different versions for different types of positions</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Generated Letter Section */}
            <div>
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Generated Cover Letter</CardTitle>
                      <CardDescription>AI-powered, personalized content</CardDescription>
                    </div>
                    {generatedLetter && (
                      <div className="flex gap-2">
                      
                        <Button size="sm" variant="outline" onClick={exportPDF}>
                          
                          Copy
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isGenerating ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Generating your personalized cover letter...</p>
                      </div>
                    </div>
                  ) : generatedLetter ? (
                    <div className="space-y-4">
                      <Textarea
                        value={generatedLetter}
                        onChange={(e) => setGeneratedLetter(e.target.value)}
                        rows={25}
                        className="w-full font-mono text-sm"
                      />
                      <div className="text-xs text-gray-500">
                        <p>✨ Generated content is editable. Make any adjustments before saving or exporting.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      <div className="text-center">
                        <Wand2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Your generated cover letter will appear here</p>
                        <p className="text-sm mt-2">Fill in the job details and click generate to get started</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};