import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { RFQStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AppConfigService } from '../config/config.service';
import { adminDailyDigestTemplate, rfqOverdueAlertTemplate } from './email-templates';

const OVERDUE_CHECK_INTERVAL_MS = 2 * 60 * 60 * 1000;   // every 2 hours
const DAILY_DIGEST_INTERVAL_MS  = 24 * 60 * 60 * 1000;  // every 24 hours
const OVERDUE_THRESHOLD_MS      = 48 * 60 * 60 * 1000;  // RFQs older than 48 h

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerService.name);
  private overdueTimer: NodeJS.Timeout | null = null;
  private digestTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  onModuleInit() {
    this.overdueTimer = setInterval(() => this.checkOverdueRfqs(), OVERDUE_CHECK_INTERVAL_MS);
    this.digestTimer  = setInterval(() => this.sendDailyDigest(),  DAILY_DIGEST_INTERVAL_MS);

    this.logger.log('Scheduler started: overdue-check every 2 h, daily digest every 24 h');
  }

  onModuleDestroy() {
    if (this.overdueTimer) clearInterval(this.overdueTimer);
    if (this.digestTimer)  clearInterval(this.digestTimer);
  }

  private async checkOverdueRfqs() {
    const threshold = new Date(Date.now() - OVERDUE_THRESHOLD_MS);

    const overdue = await this.prisma.rFQ.findMany({
      where: { status: RFQStatus.NEW, createdAt: { lt: threshold } },
      select: { id: true, name: true, country: true, product: true, createdAt: true },
    });

    if (overdue.length === 0) return;

    const template = rfqOverdueAlertTemplate(overdue);
    await this.sendEmail(this.config.adminEmail, template.subject, template.html, 'rfq-overdue-alert');
  }

  private async sendDailyDigest() {
    const since = new Date(Date.now() - DAILY_DIGEST_INTERVAL_MS);

    const [newCount, inReviewCount, quotedCount, recentRfqs] = await Promise.all([
      this.prisma.rFQ.count({ where: { status: RFQStatus.NEW } }),
      this.prisma.rFQ.count({ where: { status: RFQStatus.IN_REVIEW } }),
      this.prisma.rFQ.count({ where: { status: RFQStatus.QUOTED } }),
      this.prisma.rFQ.findMany({
        where: { createdAt: { gte: since } },
        select: { id: true, name: true, country: true, product: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const template = adminDailyDigestTemplate({ newCount, inReviewCount, quotedCount, recentRfqs });
    await this.sendEmail(this.config.adminEmail, template.subject, template.html, 'admin-daily-digest');
  }

  private async sendEmail(to: string, subject: string, html: string, templateName: string) {
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

      this.logger.log(`Scheduled email sent [${templateName}] → ${to}`);
    } catch (err) {
      status = 'FAILED';
      error  = err instanceof Error ? err.message : String(err);
      this.logger.error(`Scheduled email failed [${templateName}] → ${to}: ${error}`);
    }

    await this.prisma.notificationLog.create({
      data: { recipient: to, template: templateName, status, error },
    });
  }
}
