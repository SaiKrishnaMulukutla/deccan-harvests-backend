import { Injectable, NotFoundException } from '@nestjs/common';
import { RFQStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { UpdateRfqStatusDto } from './dto/update-rfq-status.dto';
import { PaginationDto, buildPaginationMeta } from '../common/dto/pagination.dto';

@Injectable()
export class RfqService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateRfqDto) {
    const rfq = await this.prisma.rFQ.create({ data: dto });

    // Fire-and-forget notifications
    this.notifications.sendRfqReceivedToAdmin(rfq).catch(() => null);
    this.notifications.sendRfqAcknowledgement(rfq).catch(() => null);

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
    await this.findOne(id);
    return this.prisma.rFQ.update({ where: { id }, data: dto });
  }
}
