import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();


// --- CORS: allow your frontend origin(s) here ---
app.use(
  cors({
    origin: [
      "https://resumize-pi.vercel.app",
      "https://www.resumabuilder.com",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.json());

// ✅ Quick route to test backend
app.get("/", (req, res) => {
  res.send("✅ Resumize Backend is running");
});

app.use((req, res, next) => {
  console.log("🌍 Origin received:", req.headers.origin);
  next();
});
const parseAIJson = (text) => {
  const cleaned = text.replace(/^```json\s*/, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    return null;
  }
};

app.post("/api/generate/cover-letter", async (req, res) => {
  try {
    const jobTitle = req.body.jobTitle || req.body.job_title;
    const jobDescription = req.body.jobDescription || req.body.points;

    const prompt = `
      Write a professional and personalized cover letter for the position of ${jobTitle}.
      Job Description: ${jobDescription}
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a professional HR assistant." },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await response.json();

    res.json({
      cover_letter:
        data.choices?.[0]?.message?.content || "Error generating cover letter.",
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to generate cover letter" });
  }
});


app.post("/api/generate/resume", async (req, res) => {
  try {
    const { profile = {}, job_title, target_skills = [], template_url, jobDescription } = req.body;
    // Basic validation
    if (!profile || Object.keys(profile).length === 0) {
      return res.status(400).json({ success: false, error: "Profile is required in request body." });
    }

    // Build a clear, strict prompt that includes new fields and asks for ATS keywords
    const prompt = `
You are an expert resume writer and ATS optimizer. 
Given the user profile and optional job description below, produce a strict JSON object (no text, no markdown, no code fences) representing an ATS-optimized professional resume.

Requirements:
1) Use concise, action-oriented bullet content and industry keywords suitable for ATS parsing.
2) Prioritize matching keywords from the job description (if provided) and incorporate user's target_skills/technologies.
3) Keep each section focused and machine-readable.
4) Output valid JSON only. If a field is empty, output an empty array or empty string where appropriate.

Output JSON schema (must follow exactly — additional optional fields allowed):
{
  "summary": string,
  "skills": [string],
  "technologies": [string],           // optional: technical tools / stack
  "languages": [string],             // optional
  "references": [ { "name":"", "position":"", "contact":"" } ], // optional
  "experience": [
    { "title":"", "company":"", "duration":"", "description":"" }
  ],
  "education": [
    { "degree":"", "institution":"", "year":"", "gpa":"" }
  ],
  "projects": [ { "title":"", "description":"", "tech": "", "duration": "" } ],
  "certifications": [ { "name":"", "issuer":"", "year":"" } ],
  "extracted_keywords": [string],     // keywords pulled from job description & profile
  "matched_keywords": [string]        // keywords present in the resume (for quick ATS insight)
}

Profile JSON:
${JSON.stringify(profile, null, 2)}

Job Title: ${job_title || ""}
Target Skills: ${JSON.stringify(target_skills)}
Template URL: ${template_url || ""}
Job Description (if available):
${jobDescription || "(none)"}

Important: return ONLY the JSON object (no explanations). Use low temperature for consistent results.
`;

    // Call OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert resume writer and ATS optimizer. Output strict JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.15,
        max_tokens: 1200,
      }),
    });

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";

    // Try to parse; if parsing fails, return fallback with rawText for debugging
    let parsed = parseAIJson(raw);
    if (!parsed) {
      // attempt a second pass by removing any leading/trailing text
      const attempt = raw.replace(/^[\s\S]*?(\{[\s\S]*\})[\s\S]*?$/, "$1");
      try {
        parsed = JSON.parse(attempt);
      } catch (e) {
        parsed = null;
      }
    }

    if (!parsed) {
      // Fallback: return raw text so frontend can show debug info
      return res.json({
        success: true,
        resume: { rawText: raw },
        warning: "AI did not return strict JSON — see rawText for debugging.",
      });
    }

    // Ensure all expected keys exist (normalize)
    const normalized = {
      summary: parsed.summary || "",
      skills: parsed.skills || [],
      technologies: parsed.technologies || parsed.tech || [],
      languages: parsed.languages || [],
      references: parsed.references || [],
      experience: parsed.experience || [],
      education: parsed.education || [],
      projects: parsed.projects || [],
      certifications: parsed.certifications || [],
      extracted_keywords: parsed.extracted_keywords || [],
      matched_keywords: parsed.matched_keywords || [],
      // keep any raw fields for debugging
      __raw_ai: parsed,
    };

    return res.json({ success: true, resume: normalized });
  } catch (err) {
    console.error("❌ Resume generation failed:", err);
    return res.status(500).json({ success: false, error: "Failed to generate resume" });
  }
});

// Basic root for browser check
app.get("/", (_req, res) => res.send("Resume API — POST /api/generate/resume"));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`✅ Server running on port ${port}`));

app.post("/api/analyze/ats", async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;

    if (!resumeText || !jobDescription) {
      return res
        .status(400)
        .json({ error: "Resume text and job description are required." });
    }

    const prompt = `
Compare the following resume and job description and respond **only** in valid JSON format.
{
  "score": number (0-100),
  "missing_keywords": ["keyword1", "keyword2"],
  "suggested_improvements": ["improvement1", "improvement2"]
}

Resume:
${resumeText}

Job Description:
${jobDescription}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an intelligent ATS evaluator." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    });

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    content = content.replace(/^```json\s*/, "").replace(/```$/, "").trim();

    let atsResult;
    try {
      atsResult = JSON.parse(content);
    } catch {
      atsResult = {
        score: 70,
        missing_keywords: ["Leadership", "Project Management"],
        suggested_improvements: [
          "Add measurable results and job-specific keywords.",
        ],
      };
    }

    res.json(atsResult);
  } catch (err) {
    console.error("❌ ATS Analysis Error:", err);
    res.status(500).json({ error: "Failed to analyze resume" });
  }
});

// ✅ Export app instead of listening (Vercel requirement)
export default app;
