const nodemailer = require('nodemailer');

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendVerificationEmail(email, token) {
  const base = process.env.APP_URL || 'http://localhost:5200';
  const link = `${base}/verify-email?token=${token}`;

  if (!process.env.SMTP_HOST) {
    console.log(`\n[DEV] Email verification link for ${email}:\n${link}\n`);
    return;
  }

  await getTransporter().sendMail({
    from: `"Roamera" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verify your Roamera account',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="margin:0 0 8px">Welcome to Roamera ✈️</h2>
        <p style="color:#64748b;margin:0 0 24px">Click the button below to verify your email address.</p>
        <a href="${link}" style="display:inline-block;padding:14px 28px;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;font-weight:700">
          Verify Email
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">Link expires in 24 hours. If you didn't create an account, ignore this.</p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail };
