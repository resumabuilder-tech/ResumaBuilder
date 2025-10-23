import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Plus, Trash2, Download, Wand2, Save, Eye, Crown, Lock, Sparkles } from 'lucide-react';
import { Resume, ResumeTemplate } from '../types';
import logo from 'figma:asset/2cc5c58a6356b9bc99595ba4c64a3c807447e92a.png';
import { fetchTemplates } from '../lib/resumeService';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import html2pdf from "html2pdf.js";

interface ResumeBuilderProps {
  onBack: () => void;
}
// Add this above your component if TS types mismatch
declare module "html2pdf.js" {
  interface Html2PdfOptions {
    margin?: number | [number, number, number, number];
    filename?: string;
    image?: { type?: "jpeg" | "png" | "webp"; quality?: number };
    html2canvas?: any;
    jsPDF?: any;
  }
}

export const ResumeBuilder: React.FC<ResumeBuilderProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [currentStep, setCurrentStep] = useState<'templates' | 'editor' | 'preview'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewHTML, setPreviewHTML] = useState<string | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<ResumeTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [aiResume, setAiResume] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      const templates = await fetchTemplates();
      setAvailableTemplates(templates);
      setLoadingTemplates(false);
    };
    loadTemplates();
  }, []);


  const [resumeData, setResumeData] = useState<Partial<Resume>>({
    title: 'My Resume',
    personal_info: {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      portfolio: ''
    },
    education: [{ degree: '', institution: '', year: '', gpa: '' }],
    experience: [{ title: '', company: '', duration: '', description: '' }],
    skills: [],
    template: 'modern'
  });

  const [newSkill, setNewSkill] = useState('');

  const handleTemplateSelect = (template: ResumeTemplate) => {
  if (template.is_premium && user?.plan !== 'premium'|| 'paid') {
    alert('⚠️ This is a premium template. Upgrade to Premium to use it!');
    return;
  }
                              
  setSelectedTemplate(template);
  setResumeData(prev => ({ ...prev, template: template.id }));
  setCurrentStep('editor');
};


  const addEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [...(prev.education || []), { degree: '', institution: '', year: '', gpa: '' }]
    }));
  };

  const addExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experience: [...(prev.experience || []), { title: '', company: '', duration: '', description: '' }]
    }));
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setResumeData(prev => ({
        ...prev,
        skills: [...(prev.skills || []), newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills?.filter((_, i) => i !== index) || []
    }));
  };

 // inside ResumeBuilder.tsx
async function generateAIContent() {
  console.log("📥 [CLIENT] generateAIContent() called");
  setIsGenerating(true);

  const payload = {
    profile: {
      name: resumeData.personal_info?.name || "",
      email: resumeData.personal_info?.email || "",
      phone: resumeData.personal_info?.phone || "",
      location: resumeData.personal_info?.location || "",
      linkedin: resumeData.personal_info?.linkedin || "",
      github: resumeData.personal_info?.github || "",
      portfolio: resumeData.personal_info?.portfolio || "",
      summary: resumeData.summary || "",
      skills: resumeData.skills || [],
      experience: resumeData.experience || [],
      education: resumeData.education || [],
      projects: resumeData.projects || [],
      certifications: resumeData.certifications || [],
    },
    job_title: resumeData.title || "",
    target_skills: (resumeData.skills || []).slice(0, 6),
    template_url: selectedTemplate?.url || "",
  };

  try {
    console.log("📤 [CLIENT] Sending payload to /api/generate/resume", payload);

    const response = await fetch('https://resumize-backend.vercel.app/api/generate/resume', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("📡 [CLIENT] Raw response status:", response.status, response.statusText);

    // ✅ Read JSON only once!
    const data = await response.json();
    console.log("📥 [CLIENT] Backend response:", data);

    if (!data || !data.success) {
      alert("AI generation failed — check server logs");
      return;
    }

    const resumeDataFromAI = data.resume;

    // ✅ Update your state safely
    setResumeData((prev) => ({
      ...prev,
      summary: resumeDataFromAI.summary || "",
      skills: resumeDataFromAI.skills || [],
      experience: resumeDataFromAI.experience || [],
      education: resumeDataFromAI.education || [],
      projects: resumeDataFromAI.projects || [],
      certifications: resumeDataFromAI.certifications || [],
    }));

    // ✅ Build the preview
    await buildPreviewFromAI(resumeDataFromAI);

    console.log("✅ [CLIENT] Resume successfully generated and preview built.");
  } catch (err) {
    console.error("❌ [CLIENT] Exception generateAIContent:", err);
    alert("Error generating resume — see console and server logs.");
  } finally {
    setIsGenerating(false);
    console.log("🟢 [CLIENT] generateAIContent finished");
  }
}


// ✅ Helper to update local resume state
const handleAIResponse = (aiResume: AIResume) => {
  setResumeData((prev) => ({
    ...prev,
    summary: aiResume.summary || "",
    skills: aiResume.skills || [],
    experience: aiResume.experience || [],
    education: aiResume.education || [],
    projects: aiResume.projects || [],
    certifications: aiResume.certifications || [],
  }));
};

// ✅ AI Resume Interface
interface AIResume {
  summary: string;
  skills: string[];
  experience: {
    title: string;
    company: string;
    duration: string;
    description: string;
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
    gpa: string;
  }[];
  projects: any[];
  certifications: any[];
}

async function buildPreviewFromAI(aiResume: AIResume) {
  if (!selectedTemplate?.url) {
    setPreviewHTML(
      `<div class="p-6 bg-white"><pre>${escapeHtml(JSON.stringify(aiResume, null, 2))}</pre></div>`
    );
    setPreviewMode(true);
    return;
  }

  try {
    const resp = await fetch(selectedTemplate.url);
    let html = await resp.text();

    if (typeof aiResume === "object") {
      html = html
        .replace(/{{summary}}/g, aiResume.summary || "")
        .replace(/{{skills}}/g, (aiResume.skills || []).join(", "))
        .replace(
          /{{experience}}/g,
          (aiResume.experience || [])
            .map(
              (e) =>
                `<b>${e.title}</b> — ${e.company} (${e.duration})<br>${e.description || ""}`
            )
            .join("<br><br>")
        )
        .replace(
          /{{education}}/g,
          (aiResume.education || [])
            .map(
              (ed) =>
                `${ed.degree} — ${ed.institution} (${ed.year || ""}) ${
                  ed.gpa ? "| GPA: " + ed.gpa : ""
                }`
            )
            .join("<br>")
        )
        .replace(
          /{{projects}}/g,
          (aiResume.projects || [])
            .map((p) => (p.title ? `${p.title}: ${p.description}` : p))
            .join("<br>")
        )
        .replace(
          /{{certifications}}/g,
          (aiResume.certifications || [])
            .map((c) => (c.name ? `${c.name} (${c.year})` : c))
            .join("<br>")
        );
    } else if (typeof aiResume === "string") {
      html = html.replace(/{{summary}}/g, aiResume);
    }

    html = cleanTemplate(html);
    setPreviewHTML(html);
    setPreviewMode(true);
  } catch (err) {
    console.error("Error building preview from AI:", err);
    setPreviewHTML(
      `<div class="p-4"><pre>${escapeHtml(JSON.stringify(aiResume, null, 2))}</pre></div>`
    );
    setPreviewMode(true);
  }
}

function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

  


const handleDownloadPDF = async () => {
  try {
    await handlePreview(); // 🔄 Refresh template with latest form data

    const iframe = document.querySelector("iframe");
    if (!iframe) {
      alert("Please preview your resume before downloading.");
      return;
    }

    const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
    const content = iframeDocument?.body;

    if (!content) {
      alert("No preview content found.");
      return;
    }

    const canvas = await html2canvas(content, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = (canvas.height * pageWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
    pdf.save(`${resumeData.personal_info?.name || "resume"}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again.");
  }
};

// 🧠 Clean function to remove placeholders and empty tags

const cleanTemplate = (html: string) => {
  // Remove unreplaced placeholders like {{xyz}}
  html = html.replace(/{{\s*[\w.-]+\s*}}/g, "");
  // Clean up double spaces or leftover <br>
  return html.replace(/\s{2,}/g, " ").replace(/(<br>\s*){2,}/g, "<br>");
};

const handlePreview = async () => {
  if (!selectedTemplate?.url) {
    alert("Please select a template first.");
    return;
  }

  try {
    const response = await fetch(selectedTemplate.url);
    let html: string = await response.text();


    const contentSource = aiResume && aiResume.trim().length > 0 ? aiResume : null;

    if (contentSource) {
      html = html.replace(/{{ai_resume}}/g, contentSource);
    } else {
      html = html
        .replace(/{{name}}/g, resumeData.personal_info?.name || "")
        .replace(/{{email}}/g, resumeData.personal_info?.email || "")
        .replace(/{{phone}}/g, resumeData.personal_info?.phone || "")
        .replace(/{{location}}/g, resumeData.personal_info?.location || "")
        .replace(/{{linkedin}}/g, resumeData.personal_info?.linkedin || "")
        .replace(/{{github}}/g, resumeData.personal_info?.github || "")
        .replace(/{{portfolio}}/g, resumeData.personal_info?.portfolio || "")
        .replace(/{{title}}/g, resumeData.title || "")
        .replace(/{{summary}}/g, resumeData.summary || "")
        .replace(/{{skills}}/g, (resumeData.skills || []).join(", "))
        .replace(
          /{{experience}}/g,
          [
            ...(resumeData.experience || []).map(
              (exp) => `${exp.title} at ${exp.company} (${exp.duration})`
            ),
            ...(resumeData.projects || []).map(
              (proj) => `
              ${proj.title} — ${proj.description} [${proj.tech}] (${proj.duration})`
            ),
          ].join("<br>")
        )
        .replace(
          /{{education}}/g,
          (resumeData.education || [])
            .map((edu) => `${edu.degree} - ${edu.institution} (${edu.year})`)
            .join("<br>")
        )
        .replace(
          /{{certifications}}/g,
          (resumeData.certifications || [])
            .map((cert) => `${cert.name} - ${cert.issuer} (${cert.year})`)
            .join("<br>")
        );
    }

    html = cleanTemplate(html);
    setPreviewHTML(html);
    setPreviewMode(true);
  } catch (error) {
    console.error("Error loading preview:", error);
    alert("Failed to load template preview.");
  }
};



  // Template Selection Screen
  if (currentStep === 'templates') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-border p-4 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-primary">Choose Resume Template</h1>
            </div>
            
            <Badge variant={user?.plan === 'paid' ? 'default' : 'secondary'}>
              {user?.plan === 'paid' ? (
                <>
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </>
              ) : 'Free Plan'}
            </Badge>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-4 md:p-6">
          {/* Info Banner for Free Users */}
          {user?.plan === 'free' && (
            <Card className="mb-6 bg-muted border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="mb-2">
                      You're on the Free plan. You have access to basic templates. Upgrade to Premium for premium templates and watermark-free exports!
                    </p>
                    <Button size="sm" variant="default">
                      <Crown className="h-3 w-3 mr-2" />
                      Upgrade to Premium
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All Templates</TabsTrigger>
              <TabsTrigger value="free">Free Templates</TabsTrigger>
              <TabsTrigger value="premium">Premium Templates</TabsTrigger>
            </TabsList>

            {/* All Templates */}
            <TabsContent value="all" className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableTemplates.filter(t => t.is_active).map(template => (
                  <Card 
                    key={template.id} 
                    className={`hover:shadow-lg transition-all cursor-pointer border-2 ${
                      template.is_premium && user?.plan === 'free' 
                        ? 'border-border opacity-90' 
                        : 'border-border hover:border-primary'
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        {template.is_premium && (
                          <Badge variant="default" className="bg-primary">
                            <Crown className="h-3 w-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <img
                          src={template.preview_image || '/default-template.png'}
                          alt={template.name}
                          className="w-full aspect-[8.5/11] object-cover rounded-lg"
                        />
                      </div>

                      <div className="aspect-[8.5/11] bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                        <div className="text-center p-6">
                          <div className="w-3/4 h-3 bg-slate-300 rounded mx-auto mb-3"></div>
                          <div className="w-1/2 h-2 bg-slate-300 rounded mx-auto mb-6"></div>
                          <div className="space-y-2">
                            <div className="w-full h-2 bg-slate-300 rounded"></div>
                            <div className="w-5/6 h-2 bg-slate-300 rounded"></div>
                            <div className="w-4/5 h-2 bg-slate-300 rounded"></div>
                          </div>
                        </div>
                        {template.is_premium && user?.plan === 'free' && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="text-center text-white">
                              <Lock className="h-8 w-8 mx-auto mb-2" />
                              <p>Premium Only</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <Badge variant="outline">{template.category}</Badge>
                        <Button 
                          size="sm"
                          disabled={template.is_premium && user?.plan === 'free'}
                        >
                          {template.is_premium && user?.plan === 'free' ? (
                            <>
                              <Lock className="h-3 w-3 mr-1" />
                              Locked
                            </>
                          ) : 'Select Template'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Free Templates */}
            <TabsContent value="free">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableTemplates.filter(t => t.is_active && !t.is_premium).map(template => (
                  <Card 
                    key={template.id} 
                    className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <img
                          src={template.preview_image || '/default-template.png'}
                          alt={template.name}
                          className="w-full aspect-[8.5/11] object-cover rounded-lg"
                        />
                      </div>

                      <div className="aspect-[8.5/11] bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg mb-4 flex items-center justify-center">
                        <div className="text-center p-6">
                          <div className="w-3/4 h-3 bg-slate-300 rounded mx-auto mb-3"></div>
                          <div className="w-1/2 h-2 bg-slate-300 rounded mx-auto mb-6"></div>
                          <div className="space-y-2">
                            <div className="w-full h-2 bg-slate-300 rounded"></div>
                            <div className="w-5/6 h-2 bg-slate-300 rounded"></div>
                            <div className="w-4/5 h-2 bg-slate-300 rounded"></div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <Badge variant="outline">{template.category}</Badge>
                        <Button size="sm">Select Template</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Premium Templates */}
            <TabsContent value="premium">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableTemplates.filter(t => t.is_active && t.is_premium).map(template => (
                  <Card 
                    key={template.id} 
                    className={`hover:shadow-lg transition-all cursor-pointer border-2 ${
                      user?.plan === 'free' 
                        ? 'border-border opacity-90' 
                        : 'border-border hover:border-primary'
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge variant="default" className="bg-primary">
                          <Crown className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <img
                        src={template.preview_image || '/default-template.png'}
                        alt={template.name}
                        className="w-full aspect-[8.5/11] object-cover rounded-lg"
                        />
                        </div>

                      <div className="aspect-[8.5/11] bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                        <div className="text-center p-6">
                          <div className="w-3/4 h-3 bg-slate-300 rounded mx-auto mb-3"></div>
                          <div className="w-1/2 h-2 bg-slate-300 rounded mx-auto mb-6"></div>
                          <div className="space-y-2">
                            <div className="w-full h-2 bg-slate-300 rounded"></div>
                            <div className="w-5/6 h-2 bg-slate-300 rounded"></div>
                            <div className="w-4/5 h-2 bg-slate-300 rounded"></div>
                          </div>
                        </div>
                        {user?.plan === 'free' && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="text-center text-white">
                              <Lock className="h-8 w-8 mx-auto mb-2" />
                              <p>Premium Only</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <Badge variant="outline">{template.category}</Badge>
                        <Button 
                          size="sm"
                          disabled={user?.plan === 'free'}
                        >
                          {user?.plan === 'free' ? (
                            <>
                              <Lock className="h-3 w-3 mr-1" />
                              Locked
                            </>
                          ) : 'Select Template'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    );
  }

  // Editor Screen (existing functionality)
  if (currentStep === 'editor') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-border p-4 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setCurrentStep('templates')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Change Template
              </Button>
              <div>
                <h1 className="text-primary">Resume Builder</h1>
                {selectedTemplate && (
                  <p className="text-muted-foreground">
                    Using: {selectedTemplate.name}
                    {selectedTemplate.is_premium && (
                      <Badge variant="default" className="bg-primary ml-2">
                        <Crown className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handlePreview} variant="outline">
                Preview
                </Button>

              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                className="flex gap-2"
  >
                Download PDF
              </Button>
            </div>
          </div>
        </header>

       <main className="max-w-7xl mx-auto p-4 md:p-6">
        {previewMode ? (
          <div className="relative">
            <Button
              onClick={() => setPreviewMode(false)}
              variant="outline"
              className="absolute top-4 left-4 z-10"
            >
              Back to Edit
              </Button>
              <iframe
                srcDoc={previewHTML || "<p>Loading preview...</p>"}
                className="w-full min-h-screen border-none rounded-lg shadow-lg bg-white"
                title="Resume Preview"
              />
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left Column - Form */}
            <div className="space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Your contact details and basic information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={resumeData.personal_info?.name || ''}
                      onChange={(e) => setResumeData(prev => ({
                        ...prev,
                        personal_info: { ...prev.personal_info!, name: e.target.value }
                      }))}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={resumeData.personal_info?.email || ''}
                      onChange={(e) => setResumeData(prev => ({
                        ...prev,
                        personal_info: { ...prev.personal_info!, email: e.target.value }
                      }))}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={resumeData.personal_info?.phone || ''}
                      onChange={(e) => setResumeData(prev => ({
                        ...prev,
                        personal_info: { ...prev.personal_info!, phone: e.target.value }
                      }))}
                      placeholder="+92-300-1234567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={resumeData.personal_info?.location || ''}
                      onChange={(e) => setResumeData(prev => ({
                        ...prev,
                        personal_info: { ...prev.personal_info!, location: e.target.value }
                      }))}
                      placeholder="Karachi, Pakistan"
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedin">LinkedIn (Optional)</Label>
                    <Input
                      id="linkedin"
                      value={resumeData.personal_info?.linkedin || ''}
                      onChange={(e) => setResumeData(prev => ({
                        ...prev,
                        personal_info: { ...prev.personal_info!, linkedin: e.target.value }
                      }))}
                      placeholder="linkedin.com/in/johndoe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="github">GitHub (Optional)</Label>
                    <Input
                      id="github"
                      value={resumeData.personal_info?.github || ''}
                      onChange={(e) => setResumeData(prev => ({
                        ...prev,
                        personal_info: { ...prev.personal_info!, github: e.target.value }
                      }))}
                      placeholder="github.com/johndoe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="portfolio">Portfolio (Optional)</Label>
                    <Input
                      id="portfolio"
                      value={resumeData.personal_info?.portfolio || ''}
                      onChange={(e) => setResumeData(prev => ({
                        ...prev,
                        personal_info: { ...prev.personal_info!, portfolio: e.target.value }
                      }))}
                      placeholder="johndoe.com"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Education */}
              <Card>
                <CardHeader>
                  <CardTitle>Education</CardTitle>
                  <CardDescription>Your academic background</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {resumeData.education?.map((edu, index) => (
                    <div key={index} className="space-y-3 p-4 border rounded-lg">
                      <div>
                        <Label>Degree</Label>
                        <Input
                          value={edu.degree}
                          onChange={(e) => {
                            const newEducation = [...(resumeData.education || [])];
                            newEducation[index].degree = e.target.value;
                            setResumeData(prev => ({ ...prev, education: newEducation }));
                          }}
                          placeholder="BS Computer Science"
                        />
                      </div>
                      <div>
                        <Label>Institution</Label>
                        <Input
                          value={edu.institution}
                          onChange={(e) => {
                            const newEducation = [...(resumeData.education || [])];
                            newEducation[index].institution = e.target.value;
                            setResumeData(prev => ({ ...prev, education: newEducation }));
                          }}
                          placeholder="University of Karachi"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Year</Label>
                          <Input
                            value={edu.year}
                            onChange={(e) => {
                              const newEducation = [...(resumeData.education || [])];
                              newEducation[index].year = e.target.value;
                              setResumeData(prev => ({ ...prev, education: newEducation }));
                            }}
                            placeholder="2024"
                          />
                        </div>
                        <div>
                          <Label>GPA (Optional)</Label>
                          <Input
                            value={edu.gpa}
                            onChange={(e) => {
                              const newEducation = [...(resumeData.education || [])];
                              newEducation[index].gpa = e.target.value;
                              setResumeData(prev => ({ ...prev, education: newEducation }));
                            }}
                            placeholder="3.8"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addEducation} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Education
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Certifications</CardTitle>
                  <CardDescription>Add your professional certifications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(resumeData.certifications || []).map((cert, index) => (
                      <div key={index} className="space-y-2 border p-3 rounded-lg">
                        <Label>Certification Name</Label>
                        <Input
                          value={cert.name}
                          onChange={(e) => {
                            const updated = [...(resumeData.certifications || [])];
                            updated[index].name = e.target.value;
                            setResumeData(prev => ({ ...prev, certifications: updated }));
                          }}
                          placeholder="e.g., Google Cybersecurity Professional Certificate"
                        />
                        <Label>Issuing Organization</Label>
                        <Input
                          value={cert.issuer}
                          onChange={(e) => {
                            const updated = [...(resumeData.certifications || [])];
                            updated[index].issuer = e.target.value;
                            setResumeData(prev => ({ ...prev, certifications: updated }));
                          }}
                          placeholder="e.g., Google / Coursera"
                        />
                        <Label>Year</Label>
                        <Input
                        value={cert.year}
                        onChange={(e) => {
                        const updated = [...(resumeData.certifications || [])];
                        updated[index].year = e.target.value;
                        setResumeData(prev => ({ ...prev, certifications: updated }));
                        }}
                        placeholder="e.g., 2024"
                        />
                        <Button
                          variant="destructive"
                          onClick={() => {
                            const updated = [...(resumeData.certifications || [])];
                            updated.splice(index, 1);
                            setResumeData(prev => ({ ...prev, certifications: updated }));
                          }}
                        >
                          Remove
                          </Button>
                          </div>
                        ))}
                        <Button
                          onClick={() => {
                            const updated = [...(resumeData.certifications || []), { name: "", issuer: "", year: "" }];
                            setResumeData(prev => ({ ...prev, certifications: updated }));
                          }}
                        >
                          Add Certification
                        </Button>
                      </CardContent>
                      </Card>


              {/* Experience */}
              <Card>
                <CardHeader>
                  <CardTitle>Work Experience</CardTitle>
                  <CardDescription>Your professional experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {resumeData.experience?.map((exp, index) => (
                    <div key={index} className="space-y-3 p-4 border rounded-lg">
                      <div>
                        <Label>Job Title</Label>
                        <Input
                          value={exp.title}
                          onChange={(e) => {
                            const newExperience = [...(resumeData.experience || [])];
                            newExperience[index].title = e.target.value;
                            setResumeData(prev => ({ ...prev, experience: newExperience }));
                          }}
                          placeholder="Software Engineer"
                        />
                      </div>
                      <div>
                        <Label>Company</Label>
                        <Input
                          value={exp.company}
                          onChange={(e) => {
                            const newExperience = [...(resumeData.experience || [])];
                            newExperience[index].company = e.target.value;
                            setResumeData(prev => ({ ...prev, experience: newExperience }));
                          }}
                          placeholder="Tech Company"
                        />
                      </div>
                      <div>
                        <Label>Duration</Label>
                        <Input
                          value={exp.duration}
                          onChange={(e) => {
                            const newExperience = [...(resumeData.experience || [])];
                            newExperience[index].duration = e.target.value;
                            setResumeData(prev => ({ ...prev, experience: newExperience }));
                          }}
                          placeholder="Jan 2023 - Present"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={exp.description}
                          onChange={(e) => {
                            const newExperience = [...(resumeData.experience || [])];
                            newExperience[index].description = e.target.value;
                            setResumeData(prev => ({ ...prev, experience: newExperience }));
                          }}
                          placeholder="Describe your responsibilities and achievements"
                          rows={3}
                        />
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addExperience} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Experience
                  </Button>
                </CardContent>
              </Card>
              <Card>
  <CardHeader>
    <CardTitle>Projects</CardTitle>
    <CardDescription>Highlight your key projects and achievements</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {(resumeData.projects || []).map((proj, index) => (
      <div key={index} className="space-y-2 border p-3 rounded-lg">
        <Label>Project Title</Label>
        <Input
          value={proj.title}
          onChange={(e) => {
            const updated = [...(resumeData.projects || [])];
            updated[index].title = e.target.value;
            setResumeData(prev => ({ ...prev, projects: updated }));
          }}
          placeholder="e.g., Smart City Environmental Monitoring"
        />
        <Label>Description</Label>
        <Input
          value={proj.description}
          onChange={(e) => {
            const updated = [...(resumeData.projects || [])];
            updated[index].description = e.target.value;
            setResumeData(prev => ({ ...prev, projects: updated }));
          }}
          placeholder="Brief project overview..."
        />
        <Label>Technologies Used</Label>
        <Input
          value={proj.tech}
          onChange={(e) => {
            const updated = [...(resumeData.projects || [])];
            updated[index].tech = e.target.value;
            setResumeData(prev => ({ ...prev, projects: updated }));
          }}
          placeholder="e.g., Python, FastAPI, Blockchain"
        />
        <Label>Duration</Label>
        <Input
          value={proj.duration}
          onChange={(e) => {
            const updated = [...(resumeData.projects || [])];
            updated[index].duration = e.target.value;
            setResumeData(prev => ({ ...prev, projects: updated }));
          }}
          placeholder="e.g., Jan 2024 - May 2024"
        />
        <Button
          variant="destructive"
          onClick={() => {
            const updated = [...(resumeData.projects || [])];
            updated.splice(index, 1);
            setResumeData(prev => ({ ...prev, projects: updated }));
          }}
        >
          Remove
        </Button>
      </div>
    ))}
    <Button
      onClick={() => {
        const updated = [...(resumeData.projects || []), { title: "", description: "", tech: "", duration: "" }];
        setResumeData(prev => ({ ...prev, projects: updated }));
      }}
    >
      Add Project
    </Button>
  </CardContent>
</Card>


              {/* Skills */}
              <Card>
                <CardHeader>
                  <CardTitle>Skills</CardTitle>
                  <CardDescription>Your technical and soft skills</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a skill (e.g., React, Python)"
                      onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    />
                    <Button onClick={addSkill}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {resumeData.skills?.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="pl-3 pr-1">
                        {skill}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 ml-2"
                          onClick={() => removeSkill(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* AI Generation */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Assistant</CardTitle>
                  <CardDescription>Generate professional content with AI</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={generateAIContent} 
                    disabled={isGenerating || user?.plan === 'free'}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>Generating...</>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        {user?.plan === 'free' ? 'Upgrade for AI Generation' : 'Generate with AI'}
                      </>
                    )}
                  </Button>
                  {user?.plan === 'free' && (
                    <p className="text-muted-foreground mt-2 text-center">
                      AI features available for Premium users only
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

           {/* Right Column - Live Preview */}
<div className="w-full lg:w-2/3 flex flex-col">
  <Card className="flex flex-col flex-1">
    <CardHeader>
      <CardTitle>Live Preview</CardTitle>
      <CardDescription>
        {user?.plan === 'free'
          ? 'Preview with watermark (upgrade to remove)'
          : 'Your resume preview'}
      </CardDescription>
    </CardHeader>

    <CardContent className="flex-1 overflow-hidden">
      {/* Scrollable Resume Preview */}
      <div className="relative p-6 bg-white rounded-xl shadow-md min-h-[85vh] max-w-[95%] mx-auto scale-[1.05] transform origin-top transition-transform">


        {/* Watermark for Free Users */}
        {user?.plan === 'free' && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-10">
              <div className="transform -rotate-45 text-center">
                <p className="text-6xl text-gray-900">RESUMIZE</p>
                <p className="text-2xl text-gray-900">FREE VERSION</p>
              </div>
            </div>
            <div className="absolute top-4 right-4 z-20">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="default">
                    <Crown className="h-3 w-3 mr-2" />
                    Remove Watermark
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upgrade to Premium</DialogTitle>
                    <DialogDescription>
                      Get watermark-free resumes and access to all premium features
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <h4>Premium Benefits:</h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>No watermarks on resumes</li>
                        <li>Access to all premium templates</li>
                        <li>Unlimited resumes and cover letters</li>
                        <li>AI-powered resume generation</li>
                        <li>ATS score checker</li>
                        <li>Priority support</li>
                      </ul>
                    </div>
                    <div className="bg-primary/10 p-4 rounded-lg text-center">
                      <p className="text-primary mb-2">Only PKR 2,999</p>
                      <p className="text-muted-foreground">One-time payment</p>
                    </div>
                    <Button className="w-full" onClick={onBack}>
                      Upgrade Now
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </>
        )}

        {/* Resume Content */}
        <div className="relative z-20">
          {/* Header */}
          <div className="text-center mb-6 border-b pb-4">
            <h2 className="text-primary mb-2">
              {resumeData.personal_info?.name || 'Your Name'}
            </h2>
            <div className="text-muted-foreground space-y-1">
              {resumeData.personal_info?.email && <p>{resumeData.personal_info.email}</p>}
              {resumeData.personal_info?.phone && <p>{resumeData.personal_info.phone}</p>}
              {resumeData.personal_info?.location && <p>{resumeData.personal_info.location}</p>}
            </div>
          </div>

          {/* Experience */}
          {(resumeData.experience?.length ?? 0) > 0 && resumeData.experience?.[0]?.title && (
            <div className="mb-6">
              <h3 className="text-primary mb-3 border-b pb-2">Professional Experience</h3>
              <div className="space-y-4">
                {resumeData.experience.map((exp, i) => (
                  exp.title && (
                    <div key={i}>
                      <div className="flex justify-between items-start mb-1">
                        <h4>{exp.title}</h4>
                        <span className="text-muted-foreground">{exp.duration}</span>
                      </div>
                      <p className="text-muted-foreground mb-2">{exp.company}</p>
                      <p className="text-muted-foreground">{exp.description}</p>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {resumeData.education && resumeData.education.length > 0 && resumeData.education[0]?.degree && (
            <div className="mb-6">
              <h3 className="text-primary mb-3 border-b pb-2">Education</h3>
              <div className="space-y-3">
                {(resumeData.education || []).map((edu, i) => (
                  edu.degree && (
                    <div key={i}>
                      <h4>{edu.degree}</h4>
                      <p className="text-muted-foreground">{edu.institution} • {edu.year}</p>
                      {edu.gpa && <p className="text-muted-foreground">GPA: {edu.gpa}</p>}
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {(resumeData.skills?.length ?? 0) > 0 && (
            <div className="mb-6">
              <h3 className="text-primary mb-3 border-b pb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {(resumeData.skills || []).map((skill, i) => (
                  <Badge key={i} variant="secondary">{skill}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
</div>

          </div>
          )
        }
        </main>
      </div>
    );
  }

  return null;
}

export default ResumeBuilder;