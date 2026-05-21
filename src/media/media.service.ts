import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { S3Service } from './s3.service';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  async upload(
    file: { buffer: Buffer; mimetype: string; size: number; originalname: string },
    uploadedBy: string,
    productId?: string,
  ) {
    this.s3.validateFile(file.mimetype, file.size);

    const ext  = file.originalname.split('.').pop() ?? 'bin';
    const key  = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const url  = await this.s3.upload(key, file.buffer, file.mimetype);

    return this.prisma.mediaFile.create({
      data: {
        key,
        url,
        mimeType:  file.mimetype,
        sizeBytes: file.size,
        uploadedBy,
        ...(productId ? { productId } : {}),
      },
    });
  }

  async delete(id: string) {
    const file = await this.prisma.mediaFile.findUnique({ where: { id } });
    if (!file) throw new NotFoundException('File not found');

    await this.s3.delete(file.key);
    await this.prisma.mediaFile.delete({ where: { id } });
    return { message: 'File deleted' };
  }
}
