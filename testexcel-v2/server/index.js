// TestExcel contact/service-request API.
// Flow: browser POST /api/contact -> validate -> insert into MySQL -> email
// notification -> JSON response. All secrets (DB creds, SMTP creds) are read
// from process.env only — set them in Hostinger hPanel's Node.js app
// environment-variable screen, never in this file or the repo.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';

app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' })); // small cap: this endpoint only ever receives a short form
app.use(
  cors({
    origin: ALLOWED_ORIGIN || false, // fail closed if unset, rather than silently allow any origin
    methods: ['POST'],
  })
);

// Server-side rate limiting: a real backstop the frontend can't provide.
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8, // 8 submissions per IP per 15 minutes is generous for a genuine visitor, tight for a bot/script
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests. Please try again later.' },
});

let pool;
function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 5,
    });
  }
  return pool;
}

let mailer;
function getMailer() {
  if (!mailer) {
    mailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE !== 'false',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return mailer;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function validate(body) {
  const fullName = String(body.full_name || '').trim();
  const email = String(body.email || '').trim();
  const message = String(body.message || '').trim();
  const requestRef = String(body.request_ref || '').trim();

  if (!fullName) return 'Full name is required.';
  if (!email || !EMAIL_RE.test(email)) return 'A valid email address is required.';
  if (!message || message.length < 10) return 'Please provide a bit more detail in your message.';
  if (message.length > 5000) return 'Message is too long.';
  if (!requestRef || !UUID_RE.test(requestRef)) return 'Invalid request.';
  return null;
}

app.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    const body = req.body || {};

    // Honeypot: a real visitor never fills this hidden field. Accept
    // silently without touching the database or sending mail.
    if (String(body.website || '').trim() !== '') {
      return res.json({ ok: true });
    }

    const validationError = validate(body);
    if (validationError) {
      return res.status(400).json({ ok: false, error: validationError });
    }

    const record = {
      request_ref: body.request_ref.trim(),
      full_name: body.full_name.trim(),
      company: body.company ? String(body.company).trim().slice(0, 200) : null,
      email: body.email.trim(),
      role: body.role ? String(body.role).trim().slice(0, 200) : null,
      service_interest: body.service_interest ? String(body.service_interest).trim().slice(0, 120) : null,
      message: body.message.trim(),
      source_page: body.source_page ? String(body.source_page).trim().slice(0, 500) : null,
    };

    const db = getPool();

    // Idempotency: request_ref has a UNIQUE constraint. A duplicate insert
    // (double-click, retried request) hits ER_DUP_ENTRY below instead of
    // creating a second row — caught and treated as a success, not an error.
    let insertedId;
    try {
      const [result] = await db.execute(
        `INSERT INTO contact_submissions
           (request_ref, full_name, company, email, role, service_interest, message, source_page)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.request_ref,
          record.full_name,
          record.company,
          record.email,
          record.role,
          record.service_interest,
          record.message,
          record.source_page,
        ]
      );
      insertedId = result.insertId;
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.json({ ok: true, duplicate: true });
      }
      throw err;
    }

    // Email notification. If this fails, the lead is already safely
    // persisted — do not fail the whole request over a mail-provider hiccup,
    // just log it for troubleshooting.
    try {
      const toEmail = process.env.NOTIFY_TO_EMAIL;
      if (toEmail) {
        await getMailer().sendMail({
          from: process.env.SMTP_USER,
          to: toEmail,
          replyTo: record.email,
          subject: `New TestExcel enquiry — ${record.full_name}`,
          text: [
            'New TestExcel enquiry',
            '',
            `Name: ${record.full_name}`,
            `Company: ${record.company || '-'}`,
            `Email: ${record.email}`,
            `Role: ${record.role || '-'}`,
            `Service interest: ${record.service_interest || '-'}`,
            '',
            'Message:',
            record.message,
            '',
            `Request ID: ${insertedId}`,
            `Request ref: ${record.request_ref}`,
          ].join('\n'),
          html: `
            <h2>New TestExcel enquiry</h2>
            <ul>
              <li><strong>Name:</strong> ${escapeHtml(record.full_name)}</li>
              <li><strong>Company:</strong> ${escapeHtml(record.company || '-')}</li>
              <li><strong>Email:</strong> ${escapeHtml(record.email)}</li>
              <li><strong>Role:</strong> ${escapeHtml(record.role || '-')}</li>
              <li><strong>Service interest:</strong> ${escapeHtml(record.service_interest || '-')}</li>
            </ul>
            <p><strong>Message:</strong><br>${escapeHtml(record.message).replace(/\n/g, '<br>')}</p>
            <p style="color:#666;font-size:12px;">Request ID: ${insertedId}<br>Request ref: ${escapeHtml(record.request_ref)}</p>
          `,
        });
      } else {
        console.error('NOTIFY_TO_EMAIL is not configured — lead saved but no email sent.');
      }
    } catch (mailErr) {
      console.error('Contact notification email failed:', mailErr);
    }

    return res.json({ ok: true, id: insertedId });
  } catch (err) {
    console.error('Contact form submission failed:', err); // technical detail logged server-side only
    return res.status(500).json({ ok: false, error: "We couldn't process your request. Please try again." });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`TestExcel contact API listening on port ${PORT}`);
});
