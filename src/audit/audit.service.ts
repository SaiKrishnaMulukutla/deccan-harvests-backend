import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

export interface AuditEntry {
  userId?: string;
  entity: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  log(entry: AuditEntry): void {
    const data: Prisma.AuditLogUncheckedCreateInput = {
      userId:   entry.userId ?? null,
      entity:   entry.entity,
      entityId: entry.entityId,
      action:   entry.action,
      before:   entry.before as Prisma.InputJsonValue ?? Prisma.JsonNull,
      after:    entry.after  as Prisma.InputJsonValue ?? Prisma.JsonNull,
      ip:       entry.ip,
    };

    this.prisma.auditLog
      .create({ data })
      .catch((err: unknown) =>
        this.logger.error(`Audit log failed [${entry.entity}:${entry.entityId}]`, err),
      );
  }
}
