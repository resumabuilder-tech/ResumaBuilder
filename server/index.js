import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
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
    console.log("📥 [SERVER] Resume generation request received:");
    console.log(req.body);

    //change 1 

    const { profile } = req.body;
    const {
      name,
      email,
      phone,
      location,
      linkedin,
      github,
      portfolio,
      summary,
      skills,
      experience,
      education,
    } = profile;

    //change 2 if data is missing handle it better prompt
    const prompt = `
Generate an ATS-friendly professional resume JSON object based on the following profile.
Each section should be concise, use relevant industry keywords, and formatted cleanly.
Return the response strictly as valid JSON without code fences or markdown formatting
Output strictly in JSON with this structure:
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
    model: "gpt-4o-mini", // ✅ Make sure this model exists in your OpenAI account
    messages: [
      { role: "system", content: "You are an expert resume writer." },
      { role: "user", content: prompt },
    ],
  }),
});

const data = await response.json();

let resumeText = data.choices?.[0]?.message?.content?.trim() || "";

// ✅ Try to clean code block wrappers like ```json ... ```
resumeText = resumeText.replace(/^```json/, "").replace(/```$/, "").trim();

let parsedResume;
try {
  parsedResume = JSON.parse(resumeText);
} catch (err) {
  console.warn("⚠️ [SERVER] AI response not pure JSON, returning text fallback");
  parsedResume = { rawText: resumeText };
}

// ✅ Send clean JSON to frontend
res.json({ success: true, resume: parsedResume });

  } catch (err) {
    console.error("❌ [SERVER] Resume generation failed:", err);
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

    // Strict JSON prompt
    const prompt = `
You are an ATS (Applicant Tracking System) evaluator. 
Compare the following resume and job description and respond **only** in valid JSON format.

### Resume:
${resumeText}

### Job Description:
${jobDescription}

Your JSON must strictly follow this structure:
{
  "score": number (0-100),
  "missing_keywords": ["keyword1", "keyword2", ...],
  "suggested_improvements": ["improvement1", "improvement2", ...]
}
Do not add any extra text, markdown, or explanations.
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
        temperature: 0.2, // Lower temperature for consistent JSON
      }),
    });

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    // Log raw AI response for debugging
    console.log("🧩 OpenAI raw response:", content);

    // Clean any markdown wrappers
    content = content.replace(/^```json\s*/, "").replace(/```$/, "").trim();

    // Parse JSON safely
    let atsResult;
    try {
      atsResult = JSON.parse(content);
    } catch (err) {
      console.warn("⚠️ Failed to parse AI JSON, using fallback:", err);
      atsResult = {
        score: 70,
        missing_keywords: ["Leadership", "Project Management"],
        suggested_improvements: ["Add measurable results and job-specific keywords."],
      };
    }

    res.json(atsResult);
  } catch (err) {
    console.error("❌ [SERVER] ATS Analysis Error:", err);
    res.status(500).json({ error: "Failed to analyze resume" });
  }
});


app.listen(5000, () =>
  console.log("✅ Server running on http://localhost:5000")
);
