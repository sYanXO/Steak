import nodemailer from "nodemailer";

function getRequiredMailerEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required mail configuration: ${name}`);
  }

  return value;
}

function buildTransport() {
  return nodemailer.createTransport({
    host: getRequiredMailerEnv("SMTP_HOST"),
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: getRequiredMailerEnv("SMTP_USER"),
      pass: getRequiredMailerEnv("SMTP_PASS")
    }
  });
}

export function isSmtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM
  );
}

export async function sendOtpEmail({
  to,
  subject,
  headline,
  otpCode
}: {
  to: string;
  subject: string;
  headline: string;
  otpCode: string;
}) {
  if (!isSmtpConfigured()) {
    throw new Error("OTP delivery is not configured yet. Add SMTP env vars before enabling self-service credential changes.");
  }

  const transport = buildTransport();

  await transport.sendMail({
    from: getRequiredMailerEnv("SMTP_FROM"),
    to,
    subject,
    text: `${headline}\n\nYour OTP is: ${otpCode}\n\nThis code expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>${headline}</h2>
        <p>Your OTP is:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 0.2em;">${otpCode}</p>
        <p>This code expires in 10 minutes.</p>
      </div>
    `
  });
}
