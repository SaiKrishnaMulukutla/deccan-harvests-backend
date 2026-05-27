import { Injectable, Logger } from '@nestjs/common';
import { RFQStatus } from '@prisma/client';
import { AppConfigService } from '../config/config.service';
import { PrismaService } from '../database/prisma.service';
import {
  rfqReceivedTemplate,
  rfqAcknowledgementTemplate,
  rfqStatusUpdateTemplate,
  welcomeTemplate,
  passwordChangedTemplate,
  broadcastTemplate,
} from './email-templates';

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

  async sendRfqStatusUpdate(rfq: RfqData, status: RFQStatus) {
    const template = rfqStatusUpdateTemplate(rfq, status);
    await this.send(rfq.email, template.subject, template.html, 'rfq-status-update');
  }

  async sendWelcome(user: { name: string; email: string; role: string }) {
    const template = welcomeTemplate(user);
    await this.send(user.email, template.subject, template.html, 'welcome');
  }

  async sendPasswordChanged(user: { name: string; email: string }) {
    const template = passwordChangedTemplate(user);
    await this.send(user.email, template.subject, template.html, 'password-changed');
  }

  async sendBroadcast(
    subscribers: { email: string }[],
    subject: string,
    bodyHtml: string,
  ) {
    const template = broadcastTemplate(subject, bodyHtml);
    await Promise.all(
      subscribers.map((s) =>
        this.send(s.email, template.subject, template.html, 'broadcast'),
      ),
    );
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
