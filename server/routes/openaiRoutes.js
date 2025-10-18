import express from "express";
import client from "../lib/openaiClient.js";
import fetch from 'node-fetch'; // ensure node-fetch installed
const router = express.Router();

function safeString(x) {
  if (x === undefined || x === null) return '';
  if (typeof x === 'string') return x;
  try { return JSON.stringify(x); } catch (e) { return String(x); }
}

function cleanHtmlPlaceholders(html) {
  // remove any leftover {{placeholder}} tokens and tidy empty lines
  return html.replace(/{{\s*[\w\-]+\s*}}/g, '').replace(/(\r\n|\r|\n){2,}/g, '\n\n');
}

// Helper: call chat completion
async function createCompletion(messages, opts = {}) {
  const model = opts.model || "gpt-4o-mini"; // or any model you have access to
  const response = await client.chat.completions.create({
    model,
    messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.max_tokens ?? 800,
  });
  return response.choices?.[0]?.message?.content ?? "";
}
                                                                                
// 1) Generate Resume
import express from "express";
import { createCompletion } from "../services/openai.js";



router.post("/resume", async (req, res) => {
  try {
    console.log("📥 [SERVER] Resume generation request received:");
    const { profile, job_title, target_skills, template_url } = req.body;

    if (!profile || typeof profile !== "object") {
      return res.status(400).json({ success: false, error: "Invalid or missing profile data." });
    }

    // ✅ Log the received payload
    console.log(JSON.stringify(req.body, null, 2));

    // 🧠 Step 1: Build structured data from profile
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
      projects,
      certifications,
    } = profile;

    // 🧠 Step 2: Strong prompt — forces GPT to fill the HTML template using provided data
    const prompt = `
You are a professional resume generator AI.

Task:
Generate a clean, ATS-optimized resume **using the provided data only** (no placeholders, no invented info).
You must intelligently fill the provided HTML resume template.

### Resume Data
Name: ${name}
Email: ${email}
Phone: ${phone}
Location: ${location}
LinkedIn: ${linkedin}
GitHub: ${github}
Portfolio: ${portfolio}
Summary: ${summary || "Write a 3–4 line professional summary matching skills and experience."}

Skills: ${skills?.join(", ")}

Experience:
${JSON.stringify(experience, null, 2)}

Education:
${JSON.stringify(education, null, 2)}

Projects:
${JSON.stringify(projects, null, 2)}

Certifications:
${JSON.stringify(certifications, null, 2)}

Job Title: ${job_title}
Target Skills: ${target_skills?.join(", ")}

### Template:
Fetch this HTML structure and fill all relevant placeholders with data above:
${template_url}

Rules:
- Use the HTML format directly.
- Do not invent missing fields — just skip them.
- Return ONLY the filled HTML content (no explanations, no markdown).
`;

    console.log("🧠 [SERVER] Sending structured prompt to OpenAI...");

    const aiResponse = await createCompletion(
      [{ role: "user", content: prompt }],
      { model: "gpt-4o-mini", max_tokens: 2000 }
    );

    console.log("📡 [SERVER] OpenAI responded successfully.");
    console.log("🧾 [SERVER] AI Response Preview (first 400 chars):", aiResponse.substring(0, 400));

    res.json({ success: true, html: aiResponse });
  } catch (error) {
    console.error("❌ [SERVER] Resume generation failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});





// 2) Generate Cover Letter
import express from "express";
import client from "../lib/openaiClient.js";


router.post("/generate/cover-letter", async (req, res) => {
  console.log("✅ [SERVER] /generate/cover-letter route hit");

  try {
    const { profile, company, job_title, points } = req.body;
    console.log("📦 [SERVER] Incoming Request Body:", req.body);

    if (!profile) {
      console.warn("⚠️ [SERVER] Missing profile in request body");
      return res.status(400).json({ success: false, error: "profile is required" });
    }

    const prompt = `
Write a concise, personalized cover letter for ${profile.name || "the candidate"} applying for ${job_title || "Unknown Job"} at ${company || "Unknown Company"}.
Mention these points: ${points || "N/A"}.
Include 3 short paragraphs and a closing line.
`;

    console.log("🧠 [SERVER] Sending prompt to OpenAI...");
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 600,
    });

    const content = response.choices?.[0]?.message?.content?.trim() || "";
    console.log("✅ [SERVER] OpenAI Response Received:", content.slice(0, 200) + "...");

    res.json({ success: true, cover_letter: content });
  } catch (error) {
    console.error("❌ [SERVER] Error generating cover letter:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3) ATS Checker
router.post("/ats/check", async (req, res) => {
  try {
    const { resume_text, job_description } = req.body;
    if (!resume_text || !job_description)
      return res
        .status(400)
        .json({ error: "resume_text and job_description are required" });

    const prompt = `
Analyze the resume and job description and return:
1) a numeric ATS score between 0 and 100
2) missing keywords (array)
3) suggestions to improve ATS match (array)
Output JSON: { score: number, missing_keywords: [], suggestions: [] }
Resume:
${resume_text}
Job Description:
${job_description}
`;

    const content = await createCompletion(
      [{ role: "user", content: prompt }],
      { max_tokens: 800 }
    );

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      parsed = { raw: content };
    }

    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
