interface RfqData {
  name: string;
  product: string;
  quantity: string;
}

export function rfqAcknowledgementTemplate(rfq: RfqData) {
  return {
    subject: `We received your request — Deccan Harvests`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #0A0A0A; padding: 24px 32px; margin-bottom: 32px;">
          <h1 style="color: #C9A84C; margin: 0; font-size: 20px; letter-spacing: 0.1em; text-transform: uppercase;">
            Deccan Harvests
          </h1>
          <p style="color: rgba(255,255,255,0.4); margin: 4px 0 0; font-size: 12px; letter-spacing: 0.08em;">
            PREMIUM GUNTUR SPICE EXPORTS
          </p>
        </div>

        <div style="padding: 0 32px 32px;">
          <p style="font-size: 15px; line-height: 1.6; color: #1a1a1a;">
            Dear ${rfq.name},
          </p>
          <p style="font-size: 15px; line-height: 1.7; color: #444;">
            Thank you for your interest in <strong>${rfq.product}</strong>. We have received your
            quote request for <strong>${rfq.quantity}</strong> and our team will review it shortly.
          </p>
          <p style="font-size: 15px; line-height: 1.7; color: #444;">
            You can expect to hear from us within <strong>24 hours</strong> with pricing,
            availability and any further questions.
          </p>

          <div style="margin: 32px 0; padding: 20px 24px; background: #F5F0E8; border-left: 3px solid #C9A84C;">
            <p style="margin: 0; font-size: 13px; color: #6B6560; font-style: italic;">
              Deccan Harvests — Premium Guntur Chilli & Spice Exports<br/>
              Guntur, Andhra Pradesh, India<br/>
              exports@deccanharvests.com
            </p>
          </div>
        </div>
      </div>
    `,
  };
}
