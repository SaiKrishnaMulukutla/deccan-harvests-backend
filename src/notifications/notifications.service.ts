import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../config/config.service';
import { PrismaService } from '../database/prisma.service';
import { rfqReceivedTemplate } from './templates/rfq-received.template';
import { rfqAcknowledgementTemplate } from './templates/rfq-acknowledgement.template';

interface RfqData {
  id: string;
  name: string;
  email: string;
  country: string;
  product: string;
  quantity: string;
  message?: string | null;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly config: AppConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async sendRfqReceivedToAdmin(rfq: RfqData) {
    const template = rfqReceivedTemplate(rfq);
    await this.send(this.config.adminEmail, template.subject, template.html, 'rfq-received');
  }

  async sendRfqAcknowledgement(rfq: RfqData) {
    const template = rfqAcknowledgementTemplate(rfq);
    await this.send(rfq.email, template.subject, template.html, 'rfq-acknowledgement');
  }

  private async send(to: string, subject: string, html: string, template: string) {
    let status: 'SENT' | 'FAILED' = 'SENT';
    let error: string | undefined;

    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.brevoApiKey,
        },
        body: JSON.stringify({
          sender: { email: this.config.brevoFromEmail, name: 'Deccan Harvests' },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Brevo ${res.status}: ${body}`);
      }

      this.logger.log(`Email sent [${template}] → ${to}`);
    } catch (err) {
      status = 'FAILED';
      error  = err instanceof Error ? err.message : String(err);
      this.logger.error(`Email failed [${template}] → ${to}: ${error}`);
    }

    await this.prisma.notificationLog.create({
      data: { recipient: to, template, status, error },
    });
  }
}
