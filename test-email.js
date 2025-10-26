import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.resend.com",
  port: 587,
  auth: {
    user: "resend",
    pass: "re_7vLgQ7EX_MPkzrQwn4jx5cmot2hH72Qg5"
  }
});

try {
  const info = await transporter.sendMail({
    from: "no-reply@resumabuilder.com", // Must match verified domain
    to: "aa.ayeshaarif@gmail.com",
    subject: "Test SMTP via Resend",
    text: "If you received this, your Resend SMTP is configured correctly."
  });
  console.log("✅ SMTP works!", info);
} catch (err) {
  console.error("❌ SMTP failed:", err);
}
