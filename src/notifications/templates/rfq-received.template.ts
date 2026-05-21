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
  return {
    subject: `New Quote Request — ${rfq.product} from ${rfq.country}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #0A0A0A; padding: 24px 32px; margin-bottom: 32px;">
          <h1 style="color: #C9A84C; margin: 0; font-size: 20px; letter-spacing: 0.1em; text-transform: uppercase;">
            Deccan Harvests
          </h1>
          <p style="color: rgba(255,255,255,0.4); margin: 4px 0 0; font-size: 12px; letter-spacing: 0.08em;">
            NEW QUOTE REQUEST
          </p>
        </div>

        <div style="padding: 0 32px 32px;">
          <table style="width: 100%; border-collapse: collapse;">
            ${row('Reference', `#${rfq.id.slice(-8).toUpperCase()}`)}
            ${row('Name',     rfq.name)}
            ${row('Email',    rfq.email)}
            ${row('Country',  rfq.country)}
            ${row('Product',  rfq.product)}
            ${row('Quantity', rfq.quantity)}
            ${rfq.message ? row('Message', rfq.message) : ''}
          </table>

          <div style="margin-top: 32px; padding: 16px; background: #F5F0E8; border-left: 3px solid #C9A84C;">
            <p style="margin: 0; font-size: 13px; color: #6B6560;">
              Log in to the admin panel to review and update the status of this request.
            </p>
          </div>
        </div>
      </div>
    `,
  };
}

function row(label: string, value: string) {
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
