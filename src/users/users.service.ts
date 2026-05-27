import {
  Injectable,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const BCRYPT_ROUNDS = 12;

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  password: false,
} as const;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: { ...dto, email: dto.email.toLowerCase(), password: hashed },
      select: USER_SELECT,
    });

    this.notifications.sendWelcome({ name: user.name, email: user.email, role: user.role }).catch((err: unknown) =>
      this.logger.error(`sendWelcome failed for user ${user.id}`, err),
    );

    this.audit.log({ entity: 'User', entityId: user.id, action: 'CREATE', after: { email: user.email, role: user.role } });

    return user;
  }

  findAll() {
    return this.prisma.user.findMany({ select: USER_SELECT, orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    const data: Record<string, unknown> = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
      data.tokenVersion = { increment: 1 };  // invalidate all existing sessions (H1)
    }

    const updated = await this.prisma.user.update({ where: { id }, data, select: USER_SELECT });

    if (dto.password) {
      this.notifications.sendPasswordChanged({ name: updated.name, email: updated.email }).catch((err: unknown) =>
        this.logger.error(`sendPasswordChanged failed for user ${id}`, err),
      );
    }

    this.audit.log({ entity: 'User', entityId: id, action: 'UPDATE', after: { role: updated.role, isActive: updated.isActive } });

    return updated;
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: USER_SELECT,
    });
  }
}
