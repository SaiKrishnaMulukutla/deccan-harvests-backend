import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCertificationDto } from './dto/create-certification.dto';

@Injectable()
export class CertificationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCertificationDto) {
    return this.prisma.certification.create({ data: dto });
  }

  // Public — only active, non-expired certs
  findAllPublic() {
    return this.prisma.certification.findMany({
      where: { active: true },
      orderBy: { issuedAt: 'desc' },
      select: {
        id: true, name: true, issuingBody: true,
        certNumber: true, issuedAt: true, expiresAt: true,
        fileUrl: true,
      },
    });
  }

  // Admin — all
  findAll() {
    return this.prisma.certification.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const cert = await this.prisma.certification.findUnique({ where: { id } });
    if (!cert) throw new NotFoundException('Certification not found');
    return cert;
  }

  async update(id: string, dto: Partial<CreateCertificationDto>) {
    await this.findOne(id);
    return this.prisma.certification.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.certification.delete({ where: { id } });
    return { message: 'Certification deleted' };
  }
}
