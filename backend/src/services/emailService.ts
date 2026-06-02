interface VerificationNotificationPayload {
  caseNumber: string;
  complaintTitle: string;
  complaintType: string;
  address: string;
  officialMessage: string;
  verificationDeadline: Date;
  trackingUrl: string;
  residentName: string;
  residentEmail: string;
}

interface ComplaintNotificationPayload {
  caseNumber: string;
  complaintTitle: string;
  complaintType: string;
  description: string;
  address: string;
  severity: string;
  submittedBy: string;
  trackingUrl: string;
  department: string;
  departmentEmail: string | null;
  officials: Array<{ name: string; title: string; district: number; email: string | null }>;
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ?? 'noreply@civicaccountability.app';
const SENDGRID_KEY = process.env.SENDGRID_API_KEY;

async function sendViaSendGrid(to: string, subject: string, html: string): Promise<void> {
  // Dynamic import so the package is optional in development
  const sgMail = await import('@sendgrid/mail').then((m) => m.default).catch(() => null);
  if (!sgMail) throw new Error('@sendgrid/mail not installed');
  sgMail.setApiKey(SENDGRID_KEY!);
  await sgMail.send({ to, from: FROM_EMAIL, subject, html });
}

function complaintHtml(payload: ComplaintNotificationPayload, recipientType: 'department' | 'official', recipientName: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1e3a5f;color:white;padding:20px 24px;border-radius:8px 8px 0 0">
        <h2 style="margin:0">Civic Accountability Platform</h2>
        <p style="margin:4px 0 0;opacity:.8">New Complaint Report — ${payload.caseNumber}</p>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">
        <p>Dear ${recipientName},</p>
        <p>A new complaint has been submitted ${recipientType === 'official' ? 'by a constituent in your district' : 'and routed to your department'}.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;background:#f9fafb;font-weight:600;width:140px">Case #</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${payload.caseNumber}</td></tr>
          <tr><td style="padding:8px;background:#f9fafb;font-weight:600">Type</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${payload.complaintType}</td></tr>
          <tr><td style="padding:8px;background:#f9fafb;font-weight:600">Severity</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${payload.severity.toUpperCase()}</td></tr>
          <tr><td style="padding:8px;background:#f9fafb;font-weight:600">Address</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${payload.address}</td></tr>
          <tr><td style="padding:8px;background:#f9fafb;font-weight:600">Department</td><td style="padding:8px">${payload.department}</td></tr>
        </table>
        <p style="background:#f9fafb;padding:12px;border-radius:6px;border-left:4px solid #3b82f6"><strong>Description:</strong><br>${payload.description}</p>
        <p style="text-align:center;margin-top:24px">
          <a href="${payload.trackingUrl}" style="background:#1e3a5f;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">View Complaint</a>
        </p>
        <p style="color:#6b7280;font-size:12px;text-align:center;margin-top:24px">
          Civic Accountability Platform · Philadelphia, PA<br>
          Response time is tracked publicly.
        </p>
      </div>
    </div>`;
}

function verificationHtml(p: VerificationNotificationPayload): string {
  const deadline = p.verificationDeadline.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1e3a5f;color:white;padding:20px 24px;border-radius:8px 8px 0 0">
        <h2 style="margin:0">Civic Accountability Platform</h2>
        <p style="margin:4px 0 0;opacity:.8">Resolution Notice — ${p.caseNumber}</p>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">
        <p>Hi ${p.residentName},</p>
        <p>The official assigned to your complaint has marked it as <strong>resolved</strong>.
        You have <strong>7 days</strong> to dispute this if the issue has not actually been fixed.</p>

        <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0 0 8px;font-weight:700;color:#c2410c">⏳ Verification Window Open</p>
          <p style="margin:0;color:#9a3412">If no dispute is filed, this complaint will automatically close on <strong>${deadline}</strong>.</p>
        </div>

        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;background:#f9fafb;font-weight:600;width:140px">Case #</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${p.caseNumber}</td></tr>
          <tr><td style="padding:8px;background:#f9fafb;font-weight:600">Complaint</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${p.complaintTitle}</td></tr>
          <tr><td style="padding:8px;background:#f9fafb;font-weight:600">Type</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${p.complaintType}</td></tr>
          <tr><td style="padding:8px;background:#f9fafb;font-weight:600">Address</td><td style="padding:8px">${p.address}</td></tr>
        </table>

        <p style="background:#f9fafb;padding:12px;border-radius:6px;border-left:4px solid #3b82f6">
          <strong>Official's note:</strong><br>${p.officialMessage}
        </p>

        <p style="margin-top:24px"><strong>Was the issue actually fixed?</strong></p>
        <div style="display:flex;gap:12px;margin-top:12px">
          <a href="${p.trackingUrl}" style="background:#1e3a5f;color:white;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">
            ✓ Yes, it's fixed — View complaint
          </a>
        </div>
        <div style="margin-top:12px">
          <a href="${p.trackingUrl}" style="background:#dc2626;color:white;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">
            🚫 No, this is NOT fixed — Dispute Resolution
          </a>
        </div>

        <p style="color:#6b7280;font-size:13px;margin-top:20px;padding-top:16px;border-top:1px solid #e5e7eb">
          <strong>Note:</strong> You may only dispute once. If no dispute is filed within 7 days,
          the complaint will close automatically. If a different resident submits the same complaint
          at this address, it will automatically reopen for further review.
        </p>

        <p style="color:#6b7280;font-size:12px;text-align:center;margin-top:24px">
          Civic Accountability Platform · Philadelphia, PA<br>
          This is an automated message. Do not reply to this email.
        </p>
      </div>
    </div>`;
}

export function sendVerificationNotification(payload: VerificationNotificationPayload): void {
  const subject = `Action needed: Your complaint ${payload.caseNumber} has been marked resolved`;

  if (SENDGRID_KEY) {
    sendViaSendGrid(payload.residentEmail, subject, verificationHtml(payload))
      .then(() => console.log(`[email] verification notice sent to ${payload.residentEmail}`))
      .catch((err) => console.error(`[email] failed to send verification notice:`, err.message));
    return;
  }

  // Console fallback
  const divider = '═'.repeat(50);
  const deadline = payload.verificationDeadline.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  console.log(`\n${divider}`);
  console.log(`⏳  VERIFICATION NOTICE — ${payload.caseNumber}`);
  console.log(divider);
  console.log(`  To:       ${payload.residentName} <${payload.residentEmail}>`);
  console.log(`  Subject:  ${subject}`);
  console.log(`  Complaint: ${payload.complaintTitle}`);
  console.log(`  Address:  ${payload.address}`);
  console.log(`  Deadline: ${deadline} (7 days to dispute)`);
  console.log(`  Official: "${payload.officialMessage.slice(0, 100)}${payload.officialMessage.length > 100 ? '…' : ''}"`);
  console.log(`  Track:    ${payload.trackingUrl}`);
  console.log(divider);
  console.log(`✅  Resident notified — dispute window open\n`);
}

export function sendComplaintNotifications(payload: ComplaintNotificationPayload): void {
  const divider = '═'.repeat(50);
  const titleLabel: Record<string, string> = {
    city_council: 'City Council',
    state_house: 'State House Rep.',
    state_senate: 'State Senator',
  };

  if (SENDGRID_KEY) {
    // Fire-and-forget SendGrid emails
    const recipients: Array<{ email: string; subject: string; recipientType: 'department' | 'official'; name: string }> = [];

    if (payload.departmentEmail) {
      recipients.push({
        email: payload.departmentEmail,
        subject: `New ${payload.complaintType} Report — Case ${payload.caseNumber}`,
        recipientType: 'department',
        name: payload.department,
      });
    }
    for (const o of payload.officials) {
      if (o.email) {
        recipients.push({
          email: o.email,
          subject: `Constituent Complaint — ${payload.complaintType} at ${payload.address}`,
          recipientType: 'official',
          name: `${titleLabel[o.title] ?? o.title} ${o.name}`,
        });
      }
    }

    for (const r of recipients) {
      sendViaSendGrid(r.email, r.subject, complaintHtml(payload, r.recipientType, r.name))
        .then(() => console.log(`[email] sent to ${r.email}`))
        .catch((err) => console.error(`[email] failed to ${r.email}:`, err.message));
    }
    console.log(`[email] queued ${recipients.length} SendGrid messages for ${payload.caseNumber}`);
    return;
  }

  // Console fallback for development
  console.log(`\n${divider}`);
  console.log(`📬  NEW COMPLAINT — ${payload.caseNumber}`);
  console.log(divider);
  console.log(`  Type:     ${payload.complaintType}`);
  console.log(`  Title:    ${payload.complaintTitle}`);
  console.log(`  Severity: ${payload.severity.toUpperCase()}`);
  console.log(`  Address:  ${payload.address}`);
  console.log(`  Reporter: ${payload.submittedBy}`);
  console.log(`  Track:    ${payload.trackingUrl}`);
  console.log('');

  console.log(`📧  [EMAIL → DEPARTMENT]`);
  console.log(`  To:      ${payload.department} <${payload.departmentEmail ?? 'no-email-on-file'}>`);
  console.log(`  Subject: New ${payload.complaintType} Report — Case ${payload.caseNumber}`);
  console.log(`  Body:    ${payload.description.slice(0, 120)}${payload.description.length > 120 ? '…' : ''}`);
  console.log('');

  for (const official of payload.officials) {
    console.log(`📧  [EMAIL → ELECTED OFFICIAL]`);
    console.log(`  To:      ${titleLabel[official.title] ?? official.title} ${official.name} (District ${official.district}) <${official.email ?? 'no-email-on-file'}>`);
    console.log(`  Subject: Constituent Complaint — ${payload.complaintType} at ${payload.address}`);
    console.log(`  Case #:  ${payload.caseNumber}`);
  }

  console.log(divider);
  console.log(`✅  Notifications logged (${1 + payload.officials.length} recipients)`);
  console.log(`${divider}\n`);
}
