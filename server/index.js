import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";

dotenv.config();

const app = express();

const allowedOrigins = [
  "https://resumize-pi.vercel.app",
  "http://localhost:5173", // for local dev if needed
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

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
    const { profile } = req.body;

    const prompt = `
Generate an ATS-friendly professional resume JSON object based on the following profile.
Each section should be concise, use relevant industry keywords, and formatted cleanly.
Return the response strictly as valid JSON without code fences or markdown formatting.
Structure:
{
  "summary": "...",
  "skills": ["skill1", "skill2"],
  "experience": [
    { "title": "...", "company": "...", "duration": "...", "description": "..." }
  ],
  "education": [
    { "degree": "...", "institution": "...", "year": "...", "gpa": "..." }
  ],
  "projects": [],
  "certifications": []
}

Profile:
${JSON.stringify(profile, null, 2)}
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
          { role: "system", content: "You are an expert resume writer." },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await response.json();

    let resumeText = data.choices?.[0]?.message?.content?.trim() || "";
    resumeText = resumeText.replace(/^```json/, "").replace(/```$/, "").trim();

    let parsedResume;
    try {
      parsedResume = JSON.parse(resumeText);
    } catch {
      parsedResume = { rawText: resumeText };
    }

    res.json({ success: true, resume: parsedResume });
  } catch (err) {
    console.error("❌ Resume generation failed:", err);
    res.status(500).json({ success: false, error: "Failed to generate resume" });
  }
});

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
