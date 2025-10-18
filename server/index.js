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
    const { jobTitle, jobDescription } = req.body;

    const prompt = `
      Write a professional and personalized cover letter for the position of ${jobTitle}.
      Job Description: ${jobDescription}
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
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
    res.json({ cover_letter: data.choices?.[0]?.message?.content || "Error generating cover letter." });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to generate cover letter" });
  }
});
app.post("/api/generate/resume", async (req, res) => {
  try {
    console.log("📥 [SERVER] Resume generation request received:");
    console.log(req.body);

    const { personalInfo, experience, education, skills } = req.body;

    const prompt = `
      Write a detailed professional resume in text format using the following details:
      Personal Info: ${JSON.stringify(personalInfo)}
      Experience: ${JSON.stringify(experience)}
      Education: ${JSON.stringify(education)}
      Skills: ${JSON.stringify(skills)}
    `;

    console.log("🧠 [SERVER] Sending prompt to OpenAI...");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert resume writer." },
          { role: "user", content: prompt },
        ],
      }),
    });

    console.log("📡 [SERVER] OpenAI API responded with status:", response.status);

    const data = await response.json();
    console.log("🧾 [SERVER] Response JSON:", data);

    const resumeText = data.choices?.[0]?.message?.content || null;

    if (resumeText) {
      console.log("✅ [SERVER] Successfully generated resume");
      res.json({ success: true, resume: resumeText });
    } else {
      console.warn("⚠️ [SERVER] No resume text found in OpenAI response");
      res.json({ success: false, error: "No resume generated." });
    }
  } catch (err) {
    console.error("❌ [SERVER] Resume generation failed:", err);
    res.status(500).json({ success: false, error: "Failed to generate resume" });
  }
});


app.listen(5000, () => console.log("✅ Server running on http://localhost:5000"));
