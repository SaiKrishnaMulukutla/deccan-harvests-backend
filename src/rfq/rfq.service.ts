import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RFQStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { UpdateRfqStatusDto } from './dto/update-rfq-status.dto';
import { PaginationDto, buildPaginationMeta } from '../common/dto/pagination.dto';

@Injectable()
export class RfqService {
  private readonly logger = new Logger(RfqService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateRfqDto) {
    const rfq = await this.prisma.rFQ.create({ data: dto });

    this.notifications.sendRfqReceivedToAdmin(rfq).catch((err: unknown) =>
      this.logger.error(`sendRfqReceivedToAdmin failed for rfq ${rfq.id}`, err),
    );
    this.notifications.sendRfqAcknowledgement(rfq).catch((err: unknown) =>
      this.logger.error(`sendRfqAcknowledgement failed for rfq ${rfq.id}`, err),
    );

    return rfq;
  }

  async findAll(pagination: PaginationDto, status?: RFQStatus, country?: string) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where = {
      ...(status  ? { status }  : {}),
      ...(country ? { country } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.rFQ.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.rFQ.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async findOne(id: string) {
    const rfq = await this.prisma.rFQ.findUnique({ where: { id } });
    if (!rfq) throw new NotFoundException('RFQ not found');
    return rfq;
  }

  async updateStatus(id: string, dto: UpdateRfqStatusDto) {
    const rfq = await this.findOne(id);
    const updated = await this.prisma.rFQ.update({ where: { id }, data: dto });

    this.notifications.sendRfqStatusUpdate(rfq, dto.status).catch((err: unknown) =>
      this.logger.error(`sendRfqStatusUpdate failed for rfq ${id}`, err),
    );

    this.audit.log({
      entity:   'RFQ',
      entityId: id,
      action:   'UPDATE',
      before:   { status: rfq.status },
      after:    { status: dto.status },
    });

    return updated;
  }
}
