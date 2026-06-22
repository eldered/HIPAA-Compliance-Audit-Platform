import { logger } from "@/lib/utils/logger";

/**
 * Email provider abstraction (R8). Supports Resend or SendGrid via REST so no
 * extra SDK is required. If no provider key is configured, emails are logged
 * (useful in development) rather than throwing.
 */
interface SendParams {
  to: string;
  subject: string;
  html: string;
}

const FROM = process.env.EMAIL_FROM ?? "VivAudit <noreply@vivavault.shop>";

async function send({ to, subject, html }: SendParams): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER ?? "resend";

  if (provider === "sendgrid" && process.env.SENDGRID_API_KEY) {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: parseFrom(FROM).email, name: parseFrom(FROM).name },
        subject,
        content: [{ type: "text/html", value: html }],
      }),
    });
    if (!res.ok) throw new Error(`SendGrid error ${res.status}`);
    return;
  }

  if (process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!res.ok) throw new Error(`Resend error ${res.status}`);
    return;
  }

  logger.warn("Email not sent (no provider key configured)", { to, subject });
}

function parseFrom(value: string): { name: string; email: string } {
  const match = value.match(/^(.*)<(.+)>$/);
  if (match) return { name: match[1]!.trim(), email: match[2]!.trim() };
  return { name: "VivAudit", email: value.trim() };
}

const appUrl = () => process.env.APP_URL ?? "https://vivavault.shop";

// ─────────────────────────── Templated emails ───────────────────────────

export function sendWelcomeEmail(to: string, name?: string | null): Promise<void> {
  return send({
    to,
    subject: "Welcome to VivAudit",
    html: `<h1>Welcome${name ? `, ${name}` : ""}!</h1>
      <p>Thanks for joining VivAudit — HIPAA compliance made simple.</p>
      <p>Run your first free audit from your <a href="${appUrl()}/dashboard">dashboard</a>.</p>`,
  });
}

export function sendAuditCompleteEmail(params: {
  to: string;
  companyName: string;
  score: number;
  auditId: string;
}): Promise<void> {
  return send({
    to: params.to,
    subject: `Your HIPAA audit is ready — score ${params.score}/100`,
    html: `<h1>Audit complete</h1>
      <p>${params.companyName}'s HIPAA compliance audit has finished with an overall score of
      <strong>${params.score}/100</strong>.</p>
      <p><a href="${appUrl()}/reports/${params.auditId}">View your full report &rarr;</a></p>`,
  });
}

export function sendReceiptEmail(params: {
  to: string;
  plan: string;
  amountUsd: number;
}): Promise<void> {
  return send({
    to: params.to,
    subject: "Your VivAudit receipt",
    html: `<h1>Payment received</h1>
      <p>Thanks for subscribing to the <strong>${params.plan}</strong> plan
      ($${params.amountUsd}/mo). Your subscription is now active.</p>`,
  });
}
