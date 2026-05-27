import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';

@Injectable()
export class SubscribersService {
  constructor(private readonly prisma: PrismaService) {}

  async subscribe(dto: CreateSubscriberDto) {
    const existing = await this.prisma.subscriber.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      if (existing.isActive) throw new ConflictException('Already subscribed');

      return this.prisma.subscriber.update({
        where: { id: existing.id },
        data: { isActive: true, name: dto.name, country: dto.country },
        select: { id: true, email: true },
      });
    }

    return this.prisma.subscriber.create({
      data: { ...dto, email: dto.email.toLowerCase() },
      select: { id: true, email: true },
    });
  }

  findAllActive() {
    return this.prisma.subscriber.findMany({
      where: { isActive: true },
      select: { id: true, email: true, name: true, country: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async unsubscribe(email: string) {
    await this.prisma.subscriber.updateMany({
      where: { email: email.toLowerCase() },
      data: { isActive: false },
    });
  }
}
