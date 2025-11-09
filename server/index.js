import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
const app = express();

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


// ✅ Quick route to test backend
app.get("/", (req, res) => {
  res.send("✅ Resumize Backend is running");
});

app.use((req, res, next) => {
  console.log("🌍 Origin received:", req.headers.origin);
  next();
});
const parseAIJson = (raw) => {
  const cleaned = raw.replace(/^```json\s*/, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    return null;
  }
};
const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY); 

// ====== SEND OTP ======
app.post("/api/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store in Supabase
    await supabase.from("otps").insert([
      { email, otp, expires_at: expiresAt, verified: false }
    ]);

    // Send Email
    await resend.emails.send({
      from: "Resuma Builder <noreply@resumabuilder.com>",
      to: email,
      subject: "Your OTP Code",
      html: `<p>Your OTP code is <b>${otp}</b>. It expires in 10 minutes.</p>`,
    });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error sending OTP" });
  }
});

// ====== VERIFY OTP ======
app.post("/api/verify-otp", async (req, res) => {
  try {
    const { email, otp , password , name } = req.body;
    if (!email || !otp) return res.status(400).json({ error: "Email and OTP required" });

    // 1. Verify OTP
    const { data, error } = await supabase
      .from("otps")
      .select("*")
      .eq("email", email)
      .eq("otp", otp)
      .single();

    if (error || !data) return res.status(400).json({ error: "Invalid OTP" });
    if (new Date(data.expires_at) < new Date())
      return res.status(400).json({ error: "OTP expired" });

    await supabase.from("otps").update({ verified: true }).eq("id", data.id);

    // 2. Ensure Auth user exists
    const adminClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const foundUser = existingUsers.users.find(u => u.email === email);

    let authUserId;
    if (foundUser) {
      authUserId = foundUser.id;
    } else {
      // Create a Supabase Auth user (email verified)
      const { data: createdUser, error: createErr } =
        await adminClient.auth.admin.createUser({
          email,
          password,  // pass same password user entered
          email_confirm: true,
          user_metadata: { name },
        });
      if (createErr) throw createErr;
      authUserId = createdUser.user.id;
    }

    // 3. Insert profile if missing
    const { data: profileExists } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", authUserId)
       .maybeSingle();

    if (!profileExists) {
  const { error: insertError } = await supabase
    .from("profiles")
    .insert([{ id: authUserId, email, username: name }]);
  if (insertError) throw insertError;
}


    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ error: "Error verifying OTP" });
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
1) Use concise, measurable, and achievement-based bullet points (e.g. “Improved security efficiency by 25%”).
2) Integrate as many relevant ATS-friendly terms and domain keywords as possible from:
   - Job description (if available)
   - Target skills
   - Profile technologies
   - skills
3) Ensure language clarity for ATS systems (avoid pronouns, passive voice).
4) Optimize for recruiter scanning — clear section names, bullet lists, and consistent formatting.

Write a professional resume with:
• A 4–5 line “About Me / Profile Summary” that is concise and achievement-driven.
• For each work experience, produce exactly 3–4 bullet points.
• Bullet points must be measurable, action-oriented, and ATS-friendly.
• Keep language simple, direct, and keyword-rich.

Output JSON schema (must follow exactly — additional optional fields allowed):
{
  "summary": string,
  "skills": [string],
  "technologies": [string],           // optional: technical tools / stack
  "languages": [string],             // optional
  "references": [ { "name":"", "position":"", "contact":"" } ], // optional
  "experience": [
    { "title":"", "company":"", "duration":"", description: {
  type: "array",
  items: { type: "string" }
}
 }
  ],
  "education": [
    { "degree":"", "institution":"", "year":"", "gpa":"" }
  ],
  "projects": [ { "title":"", description: {
  type: "array",
  items: { type: "string" }
}, "tech": "", "duration": "" } ],
  "certifications": [ { "name":"", "issuer":"", "year":"" } ],
  "extracted_keywords": [string],     // keywords pulled from job description & profile
  "matched_keywords": [string]        // keywords present in the resume (for quick ATS insight)
}

Profile JSON:
${JSON.stringify(profile)}

Job Title: ${job_title || ""}
Target Skills: ${JSON.stringify(target_skills)}
Template URL: ${template_url || ""}
Job Description (if available):
${jobDescription || "(none)"}

Return only a JSON object that matches the schema above exactly. No markdown, no text, no explanation.

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
    {
      role: "system",
      content: "You are an expert resume writer and ATS optimizer. Output valid JSON only. No markdown, no explanation."
    },
    { role: "user", content: prompt },
  ],
  temperature: 0.2,
  max_tokens: 2000,
})
    });
 console.log("🔐 Using OpenAI Key:", process.env.OPENAI_API_KEY ? "✅ Loaded" : "❌ Missing");
 console.log("🧾 Prompt size:", prompt.length, "characters");

    const data = await response.json();
    
    const raw = data.choices?.[0]?.message?.content || "";
    console.log("AI raw output:", raw);

    // Try to parse; if parsing fails, return fallback with rawText for debugging
    let parsed;
try {
  parsed = JSON.parse(raw);
} catch {
  parsed = null;
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
      technologies: Array.isArray(parsed.technologies) ? parsed.technologies : (Array.isArray(parsed.tech) ? parsed.tech : []),
      languages: Array.isArray(parsed.languages) ? parsed.languages : [],
      references: Array.isArray(parsed.references) ? parsed.references : [],
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      education: Array.isArray(parsed.education) ? parsed.education : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
      extracted_keywords: parsed.extracted_keywords || [],
      matched_keywords: parsed.matched_keywords || [],
      experience: Array.isArray(parsed.experience)
  ? parsed.experience.map(e => ({
      ...e,
      description: Array.isArray(e.description) ? e.description : [e.description].filter(Boolean)
    }))
  : [],
projects: Array.isArray(parsed.projects)
  ? parsed.projects.map(p => ({
      ...p,
      description: Array.isArray(p.description) ? p.description : [p.description].filter(Boolean)
    }))
  : [],

      // keep any raw fields for debugging
      __raw_ai: parsed,
    };

    return res.json({ success: true, resume: normalized });
  } catch (err) {
    console.error("❌ Resume generation failed:", err);
    return res.status(500).json({ success: false, error: "Failed to generate resume" });
  }
  
});
    

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
 




// Basic root for browser check
app.get("/", (_req, res) => res.send("Resume API — POST /api/generate/resume"));



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
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`✅ Server running on port ${port}`));
}


// ✅ Export app instead of listening (Vercel requirement)
export default app;
