import { Resend } from 'resend';

import { env } from './env';
import { logger } from './logger';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const FROM_EMAIL = 'Roamera <noreply@roamera.in>';
const APP_URL = env.NODE_ENV === 'production'
  ? 'https://roamera.in'
  : 'http://localhost:3001';

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!resend) {
    logger.info({ to, subject, html }, '[DEV EMAIL] Would send email:');
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const link = `${APP_URL}/verify-email?token=${token}`;
  await sendEmail(
    to,
    'Verify your Roamera email',
    `<h2>Welcome to Roamera!</h2>
     <p>Click the link below to verify your email address:</p>
     <p><a href="${link}">${link}</a></p>
     <p>This link expires in 24 hours.</p>`,
  );
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  await sendEmail(
    to,
    'Your Roamera login code',
    `<h2>Your login code</h2>
     <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">${code}</p>
     <p>This code expires in 10 minutes. Do not share it with anyone.</p>`,
  );
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const link = `${APP_URL}/reset-password?token=${token}`;
  await sendEmail(
    to,
    'Reset your Roamera password',
    `<h2>Password Reset</h2>
     <p>Click the link below to reset your password:</p>
     <p><a href="${link}">${link}</a></p>
     <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`,
  );
}

export async function sendNotificationEmail(
  to: string,
  username: string,
  title: string,
  body?: string,
): Promise<void> {
  await sendEmail(
    to,
    title,
    `<h2>${title}</h2>
     ${body ? `<p>${body}</p>` : ''}
     <p>Open <a href="${APP_URL}">Roamera</a> to see more.</p>
     <p style="color:#888;font-size:12px;">You received this because you have email notifications enabled. 
     <a href="${APP_URL}/settings/notifications">Manage preferences</a>.</p>`,
  );
}
