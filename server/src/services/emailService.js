import nodemailer from "nodemailer";
import { config } from "../config.js";

export async function sendEmailNotification({ subject, emailMessage, notificationEmail: userEmail }) {
  const { emailUser, emailAppPassword } = config.notifications;
  const notificationEmail = userEmail;
  if (!emailUser || !emailAppPassword || !notificationEmail) {
    return { status: "skipped", message: "Email notification settings are incomplete" };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: emailUser, pass: emailAppPassword }
  });
  const safeMessage = escapeHtml(emailMessage);

  try {
    await transporter.sendMail({
      from: `NexusFlow <${emailUser}>`,
      to: notificationEmail,
      subject,
      text: emailMessage,
      html: `<!doctype html><html><body style="margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#172033"><div style="max-width:600px;margin:32px auto;background:#fff;border:1px solid #dfe5ef;border-radius:12px;overflow:hidden"><div style="background:#172033;color:#fff;padding:24px 28px"><strong style="font-size:20px">NexusFlow</strong><div style="margin-top:6px;color:#b9c5d8">Telemetry notification</div></div><div style="padding:28px;line-height:1.6;white-space:pre-line">${safeMessage}</div><div style="padding:16px 28px;background:#f7f9fc;color:#68758a;font-size:12px">Sent by the NexusFlow rule engine</div></div></body></html>`
    });
    return { status: "sent", message: "Email notification sent" };
  } catch (error) {
    return { status: "failed", message: `Email delivery failed: ${error.message}` };
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>\"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  }[character]));
}