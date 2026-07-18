import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS?.replace(/\s/g, ""),
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const info = await transporter.sendMail({
      from: `"Al-Najah Platform" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to} - ID: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}

export function passwordResetEmail(name: string, resetUrl: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">Al-Najah Platform</h1>
        </div>
        <div style="padding:32px 24px;">
          <h2 style="color:#1a1a2e;margin:0 0 16px;font-size:20px;">Reset Your Password</h2>
          <p style="color:#4a4a68;margin:0 0 24px;line-height:1.6;">
            Hi ${name}, we received a request to reset your password. Click the button below to create a new one.
          </p>
          <div style="text-align:center;margin:0 0 24px;">
            <a href="${resetUrl}" style="display:inline-block;background:#6366f1;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
              Reset Password
            </a>
          </div>
          <p style="color:#9ca3af;font-size:13px;line-height:1.5;margin:0;">
            This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function passwordResetSuccessEmail(name: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">Al-Najah Platform</h1>
        </div>
        <div style="padding:32px 24px;">
          <h2 style="color:#1a1a2e;margin:0 0 16px;font-size:20px;">Password Updated</h2>
          <p style="color:#4a4a68;margin:0 0 24px;line-height:1.6;">
            Hi ${name}, your password has been successfully changed. You can now sign in with your new password.
          </p>
          <div style="text-align:center;margin:0 0 24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/signin" style="display:inline-block;background:#6366f1;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
              Sign In
            </a>
          </div>
          <p style="color:#9ca3af;font-size:13px;line-height:1.5;margin:0;">
            If you didn't make this change, please contact support immediately.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
