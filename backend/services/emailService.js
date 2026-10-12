const nodemailer = require("nodemailer");

const truthy = (value) => ["1", "true", "yes", "on"].includes(String(value || "").toLowerCase());

const getConfiguredRecipients = () =>
  [process.env.ADMIN_EMAIL, process.env.BOOKING_NOTIFICATION_EMAIL]
    .flatMap((value) => String(value || "").split(","))
    .map((email) => email.trim())
    .filter(Boolean);

const getTransport = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass || pass === "replace_with_gmail_app_password") {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: truthy(process.env.SMTP_SECURE),
    auth: { user, pass },
  });
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderRows = (details) =>
  Object.entries(details)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([label, value]) => {
      const readableLabel = label
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (char) => char.toUpperCase());
      return `<tr><td style="padding:8px 12px;color:#64748b;border-bottom:1px solid #e5e7eb;">${escapeHtml(readableLabel)}</td><td style="padding:8px 12px;font-weight:600;border-bottom:1px solid #e5e7eb;">${escapeHtml(value)}</td></tr>`;
    })
    .join("");

const sendNestoraEmail = async ({ to = [], cc = [], subject, title, intro, details }) => {
  const transport = getTransport();
  const recipients = [...new Set([].concat(to).filter(Boolean))];
  const ccRecipients = [...new Set([].concat(cc).filter(Boolean))];

  if (!transport || recipients.length === 0) {
    console.log(
      `[email skipped] ${subject}. Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and recipient emails to send.`,
    );
    return { skipped: true };
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;">
      <h2 style="margin:0 0 8px;color:#064e3b;">${escapeHtml(title)}</h2>
      <p style="margin:0 0 16px;color:#475569;">${escapeHtml(intro)}</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <tbody>${renderRows(details)}</tbody>
      </table>
      <p style="margin-top:18px;color:#64748b;font-size:13px;">This is an automated Nestora notification.</p>
    </div>
  `;

  await transport.sendMail({
    from,
    to: recipients,
    cc: ccRecipients,
    subject,
    text: `${title}\n\n${intro}\n\n${Object.entries(details)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n")}`,
    html,
  });

  return { skipped: false };
};

module.exports = {
  getConfiguredRecipients,
  sendNestoraEmail,
};
