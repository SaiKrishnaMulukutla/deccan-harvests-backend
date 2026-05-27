import { RFQStatus } from '@prisma/client';

// ── Shared layout ────────────────────────────────────────────────────────────

function emailLayout(subtitle: string, content: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: #0A0A0A; padding: 24px 32px; margin-bottom: 32px;">
        <h1 style="color: #C9A84C; margin: 0; font-size: 20px; letter-spacing: 0.1em; text-transform: uppercase;">
          Deccan Harvests
        </h1>
        <p style="color: rgba(255,255,255,0.4); margin: 4px 0 0; font-size: 12px; letter-spacing: 0.08em;">
          ${subtitle}
        </p>
      </div>
      <div style="padding: 0 32px 32px;">
        ${content}
      </div>
    </div>
  `;
}

function signatureBlock(): string {
  return `
    <div style="margin: 32px 0; padding: 20px 24px; background: #F5F0E8; border-left: 3px solid #C9A84C;">
      <p style="margin: 0; font-size: 13px; color: #6B6560; font-style: italic;">
        Deccan Harvests — Premium Guntur Chilli &amp; Spice Exports<br/>
        Guntur, Andhra Pradesh, India<br/>
        exports@deccanharvests.com
      </p>
    </div>
  `;
}

function tableRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding: 10px 0; font-size: 12px; color: #6B6560; text-transform: uppercase;
                 letter-spacing: 0.08em; width: 130px; vertical-align: top; border-bottom: 1px solid #EDE8DC;">
        ${label}
      </td>
      <td style="padding: 10px 0; font-size: 14px; color: #1a1a1a; border-bottom: 1px solid #EDE8DC;">
        ${value}
      </td>
    </tr>
  `;
}

// ── RFQ templates ────────────────────────────────────────────────────────────

interface RfqData {
  id: string;
  name: string;
  email: string;
  country: string;
  product: string;
  quantity: string;
  message?: string | null;
}

export function rfqReceivedTemplate(rfq: RfqData) {
  const content = `
    <table style="width: 100%; border-collapse: collapse;">
      ${tableRow('Reference', `#${rfq.id.slice(-8).toUpperCase()}`)}
      ${tableRow('Name', rfq.name)}
      ${tableRow('Email', rfq.email)}
      ${tableRow('Country', rfq.country)}
      ${tableRow('Product', rfq.product)}
      ${tableRow('Quantity', rfq.quantity)}
      ${rfq.message ? tableRow('Message', rfq.message) : ''}
    </table>
    <div style="margin-top: 32px; padding: 16px; background: #F5F0E8; border-left: 3px solid #C9A84C;">
      <p style="margin: 0; font-size: 13px; color: #6B6560;">
        Log in to the admin panel to review and update the status of this request.
      </p>
    </div>
  `;
  return {
    subject: `New Quote Request — ${rfq.product} from ${rfq.country}`,
    html: emailLayout('NEW QUOTE REQUEST', content),
  };
}

export function rfqAcknowledgementTemplate(rfq: Pick<RfqData, 'name' | 'product' | 'quantity'>) {
  const content = `
    <p style="font-size: 15px; line-height: 1.6; color: #1a1a1a;">Dear ${rfq.name},</p>
    <p style="font-size: 15px; line-height: 1.7; color: #444;">
      Thank you for your interest in <strong>${rfq.product}</strong>. We have received your
      quote request for <strong>${rfq.quantity}</strong> and our team will review it shortly.
    </p>
    <p style="font-size: 15px; line-height: 1.7; color: #444;">
      You can expect to hear from us within <strong>24 hours</strong> with pricing,
      availability and any further questions.
    </p>
    ${signatureBlock()}
  `;
  return {
    subject: `We received your request — Deccan Harvests`,
    html: emailLayout('PREMIUM GUNTUR SPICE EXPORTS', content),
  };
}

const RFQ_STATUS_COPY: Record<RFQStatus, { heading: string; body: string }> = {
  [RFQStatus.IN_REVIEW]: {
    heading: 'Your request is under review',
    body: 'Our team is reviewing your quote request for <strong>{{product}}</strong>. We will reach out within 24 hours with pricing and availability.',
  },
  [RFQStatus.QUOTED]: {
    heading: 'Your quote is ready',
    body: 'We have prepared a quote for <strong>{{product}}</strong> ({{quantity}}). Please reply to this email to proceed or ask any questions.',
  },
  [RFQStatus.CLOSED]: {
    heading: 'Your inquiry has been closed',
    body: 'Your quote request for <strong>{{product}}</strong> has been closed. If you would like to reopen it or start a new request, please contact us at exports@deccanharvests.com.',
  },
  [RFQStatus.NEW]: {
    heading: 'Request received',
    body: 'We have received your quote request for <strong>{{product}}</strong>.',
  },
};

export function rfqStatusUpdateTemplate(rfq: Pick<RfqData, 'name' | 'product' | 'quantity'>, status: RFQStatus) {
  const copy = RFQ_STATUS_COPY[status];
  const body = copy.body
    .replace('{{product}}', rfq.product)
    .replace('{{quantity}}', rfq.quantity);

  const content = `
    <p style="font-size: 15px; line-height: 1.6; color: #1a1a1a;">Dear ${rfq.name},</p>
    <h2 style="font-size: 18px; color: #1a1a1a; margin: 0 0 12px;">${copy.heading}</h2>
    <p style="font-size: 15px; line-height: 1.7; color: #444;">${body}</p>
    ${signatureBlock()}
  `;
  return {
    subject: `${copy.heading} — Deccan Harvests`,
    html: emailLayout('QUOTE REQUEST UPDATE', content),
  };
}

// ── Account templates ────────────────────────────────────────────────────────

export function welcomeTemplate(user: { name: string; email: string; role: string }) {
  const content = `
    <p style="font-size: 15px; line-height: 1.6; color: #1a1a1a;">Hi ${user.name},</p>
    <p style="font-size: 15px; line-height: 1.7; color: #444;">
      An account has been created for you on the Deccan Harvests admin portal.
      Your role is <strong>${user.role}</strong>.
    </p>
    <p style="font-size: 15px; line-height: 1.7; color: #444;">
      Log in with your email address <strong>${user.email}</strong> and the password
      provided by your administrator. Change your password after your first login.
    </p>
    <div style="margin: 32px 0; padding: 20px 24px; background: #F5F0E8; border-left: 3px solid #C9A84C;">
      <p style="margin: 0; font-size: 13px; color: #6B6560; font-style: italic;">
        If you did not expect this email, contact your administrator immediately.
      </p>
    </div>
  `;
  return {
    subject: 'Welcome to Deccan Harvests — your account is ready',
    html: emailLayout('ADMIN PORTAL', content),
  };
}

export function passwordChangedTemplate(user: { name: string; email: string }) {
  const content = `
    <p style="font-size: 15px; line-height: 1.6; color: #1a1a1a;">Hi ${user.name},</p>
    <p style="font-size: 15px; line-height: 1.7; color: #444;">
      The password for your Deccan Harvests account (<strong>${user.email}</strong>) was
      recently changed.
    </p>
    <p style="font-size: 15px; line-height: 1.7; color: #444;">
      If you made this change, no action is needed.
      If you did not make this change, contact your administrator immediately.
    </p>
    <div style="margin: 32px 0; padding: 20px 24px; background: #FEF2F2; border-left: 3px solid #DC2626;">
      <p style="margin: 0; font-size: 13px; color: #991B1B; font-style: italic;">
        This is an automated security notice. Do not reply to this email.
      </p>
    </div>
  `;
  return {
    subject: 'Your password was changed — Deccan Harvests',
    html: emailLayout('SECURITY NOTICE', content),
  };
}

// ── Scheduled / admin templates ──────────────────────────────────────────────

interface DigestData {
  newCount: number;
  inReviewCount: number;
  quotedCount: number;
  recentRfqs: { id: string; name: string; country: string; product: string; createdAt: Date }[];
}

export function adminDailyDigestTemplate(data: DigestData) {
  const rfqRows = data.recentRfqs
    .map(
      (r) => `
      <tr>
        <td style="padding: 8px 0; font-size: 13px; color: #1a1a1a; border-bottom: 1px solid #EDE8DC;">#${r.id.slice(-8).toUpperCase()}</td>
        <td style="padding: 8px 0; font-size: 13px; color: #1a1a1a; border-bottom: 1px solid #EDE8DC;">${r.name}</td>
        <td style="padding: 8px 0; font-size: 13px; color: #1a1a1a; border-bottom: 1px solid #EDE8DC;">${r.country}</td>
        <td style="padding: 8px 0; font-size: 13px; color: #1a1a1a; border-bottom: 1px solid #EDE8DC;">${r.product}</td>
      </tr>
    `,
    )
    .join('');

  const recentSection = data.recentRfqs.length > 0
    ? `
      <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #6B6560; margin-bottom: 12px;">
        Received in last 24 hours
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            ${['Ref', 'Name', 'Country', 'Product'].map((h) => `<th style="text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #6B6560; padding-bottom: 8px; border-bottom: 2px solid #EDE8DC;">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>${rfqRows}</tbody>
      </table>
    `
    : `<p style="font-size: 14px; color: #6B6560;">No new RFQs received in the last 24 hours.</p>`;

  const content = `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
      <tr>
        ${[['NEW', data.newCount], ['IN REVIEW', data.inReviewCount], ['QUOTED', data.quotedCount]].map(([label, count]) => `
          <td style="text-align: center; padding: 16px; background: #F5F0E8; border-radius: 4px;">
            <div style="font-size: 28px; font-weight: bold; color: #C9A84C;">${count}</div>
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #6B6560; margin-top: 4px;">${label}</div>
          </td>
          <td style="width: 8px;"></td>
        `).join('')}
      </tr>
    </table>
    ${recentSection}
  `;

  return {
    subject: `Daily RFQ Digest — ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    html: emailLayout('DAILY RFQ DIGEST', content),
  };
}

interface OverdueRfq {
  id: string;
  name: string;
  country: string;
  product: string;
  createdAt: Date;
}

function hoursAgo(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
}

export function rfqOverdueAlertTemplate(rfqs: OverdueRfq[]) {
  const rows = rfqs
    .map(
      (r) => `
      <tr>
        <td style="padding: 8px 0; font-size: 13px; color: #1a1a1a; border-bottom: 1px solid #EDE8DC;">#${r.id.slice(-8).toUpperCase()}</td>
        <td style="padding: 8px 0; font-size: 13px; color: #1a1a1a; border-bottom: 1px solid #EDE8DC;">${r.name}</td>
        <td style="padding: 8px 0; font-size: 13px; color: #1a1a1a; border-bottom: 1px solid #EDE8DC;">${r.country}</td>
        <td style="padding: 8px 0; font-size: 13px; color: #1a1a1a; border-bottom: 1px solid #EDE8DC;">${r.product}</td>
        <td style="padding: 8px 0; font-size: 13px; color: #DC2626; font-weight: bold; border-bottom: 1px solid #EDE8DC;">${hoursAgo(r.createdAt)}h ago</td>
      </tr>
    `,
    )
    .join('');

  const content = `
    <div style="padding: 16px 20px; background: #FEF2F2; border-left: 3px solid #DC2626; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: #991B1B;">
        <strong>${rfqs.length} quote request${rfqs.length > 1 ? 's have' : ' has'} been waiting for more than 48 hours without a response.</strong>
      </p>
    </div>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr>
          ${['Ref', 'Name', 'Country', 'Product', 'Age'].map((h) => `<th style="text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #6B6560; padding-bottom: 8px; border-bottom: 2px solid #EDE8DC;">${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="font-size: 13px; color: #6B6560; margin-top: 24px;">
      Log in to the admin panel to review and update the status of these requests.
    </p>
  `;

  return {
    subject: `Action needed: ${rfqs.length} overdue RFQ${rfqs.length > 1 ? 's' : ''} — Deccan Harvests`,
    html: emailLayout('OVERDUE RFQ ALERT', content),
  };
}

// ── Broadcast template ───────────────────────────────────────────────────────

export function broadcastTemplate(subject: string, bodyHtml: string) {
  const content = `
    ${bodyHtml}
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #EDE8DC;">
      <p style="font-size: 12px; color: #9B9490; line-height: 1.6;">
        Deccan Harvests — Guntur, Andhra Pradesh, India<br/>
        exports@deccanharvests.com<br/>
        You are receiving this because you subscribed to updates from Deccan Harvests.
      </p>
    </div>
  `;
  return {
    subject,
    html: emailLayout('PREMIUM GUNTUR SPICE EXPORTS', content),
  };
}
