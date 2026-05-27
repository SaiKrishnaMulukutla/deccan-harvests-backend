import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { RFQStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AppConfigService } from '../config/config.service';
import { adminDailyDigestTemplate, rfqOverdueAlertTemplate } from './email-templates';
import {
  OVERDUE_CHECK_INTERVAL_MS,
  DAILY_DIGEST_INTERVAL_MS,
  OVERDUE_THRESHOLD_MS,
} from '../common/constants';

const JOB_OVERDUE  = 'rfq-overdue-check';
const JOB_DIGEST   = 'daily-digest';

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerService.name);
  private overdueTimer: NodeJS.Timeout | null = null;
  private digestTimer:  NodeJS.Timeout | null = null;

  // Concurrency guards (H8)
  private overdueRunning = false;
  private digestRunning  = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  async onModuleInit() {
    // Ensure job rows exist
    await this.upsertJob(JOB_OVERDUE);
    await this.upsertJob(JOB_DIGEST);

    // Run immediately if overdue since last restart (C1)
    await this.runIfOverdue(JOB_OVERDUE, OVERDUE_CHECK_INTERVAL_MS, () => this.checkOverdueRfqs());
    await this.runIfOverdue(JOB_DIGEST,  DAILY_DIGEST_INTERVAL_MS,  () => this.sendDailyDigest());

    this.overdueTimer = setInterval(() => this.checkOverdueRfqs(), OVERDUE_CHECK_INTERVAL_MS);
    this.digestTimer  = setInterval(() => this.sendDailyDigest(),  DAILY_DIGEST_INTERVAL_MS);

    this.logger.log('Scheduler started: overdue-check every 2 h, daily digest every 24 h');
  }

  onModuleDestroy() {
    if (this.overdueTimer) clearInterval(this.overdueTimer);
    if (this.digestTimer)  clearInterval(this.digestTimer);
  }

  // ── DB-persisted job helpers ────────────────────────────────────────────────

  private async upsertJob(name: string) {
    await this.prisma.schedulerJob.upsert({
      where:  { name },
      create: { name },
      update: {},
    });
  }

  private async runIfOverdue(name: string, intervalMs: number, fn: () => Promise<void>) {
    const job = await this.prisma.schedulerJob.findUnique({ where: { name } });
    if (!job) return;

    const overdue = !job.lastRunAt || Date.now() - job.lastRunAt.getTime() >= intervalMs;
    if (overdue) {
      this.logger.warn(`Job [${name}] missed since restart — running immediately`);
      await fn();
    }
  }

  private async markJobRun(name: string) {
    await this.prisma.schedulerJob.update({
      where: { name },
      data:  { lastRunAt: new Date() },
    });
  }

  // ── Jobs ────────────────────────────────────────────────────────────────────

  private async checkOverdueRfqs() {
    if (this.overdueRunning) {
      this.logger.warn('Overdue check already running — skipping');
      return;
    }
    this.overdueRunning = true;

    try {
      const threshold = new Date(Date.now() - OVERDUE_THRESHOLD_MS);
      const overdue = await this.prisma.rFQ.findMany({
        where:  { status: RFQStatus.NEW, createdAt: { lt: threshold } },
        select: { id: true, name: true, country: true, product: true, createdAt: true },
      });

      if (overdue.length > 0) {
        const template = rfqOverdueAlertTemplate(overdue);
        await this.sendEmail(this.config.adminEmail, template.subject, template.html, 'rfq-overdue-alert');
      }

      await this.markJobRun(JOB_OVERDUE);
    } finally {
      this.overdueRunning = false;
    }
  }

  private async sendDailyDigest() {
    if (this.digestRunning) {
      this.logger.warn('Daily digest already running — skipping');
      return;
    }
    this.digestRunning = true;

    try {
      const since = new Date(Date.now() - DAILY_DIGEST_INTERVAL_MS);

      const [newCount, inReviewCount, quotedCount, recentRfqs] = await Promise.all([
        this.prisma.rFQ.count({ where: { status: RFQStatus.NEW } }),
        this.prisma.rFQ.count({ where: { status: RFQStatus.IN_REVIEW } }),
        this.prisma.rFQ.count({ where: { status: RFQStatus.QUOTED } }),
        this.prisma.rFQ.findMany({
          where:   { createdAt: { gte: since } },
          select:  { id: true, name: true, country: true, product: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const template = adminDailyDigestTemplate({ newCount, inReviewCount, quotedCount, recentRfqs });
      await this.sendEmail(this.config.adminEmail, template.subject, template.html, 'admin-daily-digest');

      await this.markJobRun(JOB_DIGEST);
    } finally {
      this.digestRunning = false;
    }
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
