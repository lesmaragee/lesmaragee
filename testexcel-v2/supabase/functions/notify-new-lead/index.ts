// Supabase Edge Function: sends TestExcel an email the moment a new row lands
// in contact_submissions. Triggered by a Database Webhook (Database → Webhooks
// in the Supabase dashboard), NOT called directly by the browser — this keeps
// the email-provider API key off the frontend entirely.
//
// Deploy:   supabase functions deploy notify-new-lead
// Secret:   supabase secrets set RESEND_API_KEY=re_xxx NOTIFY_TO_EMAIL=you@testexcel.example
//
// Uses Resend (resend.com) because it needs no SMTP server and has a
// generous free tier. Swap the fetch call below for any other provider if
// preferred — the important part is that the API key only ever lives in
// Supabase's server-side secrets, never in the repo or the browser bundle.

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFY_TO_EMAIL = Deno.env.get("NOTIFY_TO_EMAIL");
const NOTIFY_FROM_EMAIL = Deno.env.get("NOTIFY_FROM_EMAIL") ?? "TestExcel Website <onboarding@resend.dev>";

// Database Webhooks sign their payload; set this to the same value configured
// in the webhook so we reject requests that didn't actually come from Supabase.
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (WEBHOOK_SECRET) {
    const provided = req.headers.get("x-webhook-secret");
    if (provided !== WEBHOOK_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  if (!RESEND_API_KEY || !NOTIFY_TO_EMAIL) {
    console.error("notify-new-lead: RESEND_API_KEY or NOTIFY_TO_EMAIL secret is not configured");
    // Return 200 so Supabase does not endlessly retry a delivery that can never
    // succeed until secrets are set; the failure is logged for troubleshooting.
    return new Response("Notification not configured", { status: 200 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  const record = payload?.record ?? {};
  const {
    id = "",
    request_ref = "",
    full_name = "",
    company = "",
    email = "",
    role = "",
    service_interest = "",
    message = "",
    submitted_at = "",
  } = record;

  const subject = `New TestExcel enquiry — ${full_name || "unknown"}`;
  const textBody = [
    "New TestExcel enquiry",
    "",
    `Name: ${full_name}`,
    `Company: ${company || "-"}`,
    `Email: ${email}`,
    `Role: ${role || "-"}`,
    `Service interest: ${service_interest || "-"}`,
    "",
    "Message:",
    message,
    "",
    `Submitted: ${submitted_at}`,
    `Request ID: ${id}`,
    `Request ref: ${request_ref}`,
  ].join("\n");

  const htmlBody = `
    <h2>New TestExcel enquiry</h2>
    <ul>
      <li><strong>Name:</strong> ${escapeHtml(full_name)}</li>
      <li><strong>Company:</strong> ${escapeHtml(company || "-")}</li>
      <li><strong>Email:</strong> ${escapeHtml(email)}</li>
      <li><strong>Role:</strong> ${escapeHtml(role || "-")}</li>
      <li><strong>Service interest:</strong> ${escapeHtml(service_interest || "-")}</li>
    </ul>
    <p><strong>Message:</strong><br>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
    <p style="color:#666;font-size:12px;">
      Submitted: ${escapeHtml(submitted_at)}<br>
      Request ID: ${escapeHtml(id)}<br>
      Request ref: ${escapeHtml(request_ref)}
    </p>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: NOTIFY_FROM_EMAIL,
      to: [NOTIFY_TO_EMAIL],
      reply_to: email || undefined,
      subject,
      text: textBody,
      html: htmlBody,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("notify-new-lead: Resend API error", res.status, errText);
    return new Response("Email provider error", { status: 502 });
  }

  return new Response("OK", { status: 200 });
});
