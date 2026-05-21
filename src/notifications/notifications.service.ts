import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
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
  private readonly resend: Resend;
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly config: AppConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.resend = new Resend(this.config.resendApiKey);
  }

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
      await this.resend.emails.send({
        from: this.config.resendFromEmail,
        to,
        subject,
        html,
      });
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
