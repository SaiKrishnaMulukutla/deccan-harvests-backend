import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Product slug already exists');

    return this.prisma.product.create({
      data: dto,
      include: { images: true },
    });
  }

  // Public: only ACTIVE products
  findAllPublic() {
    return this.prisma.product.findMany({
      where: { status: ProductStatus.ACTIVE },
      include: { images: { select: { url: true, key: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Admin: all products
  findAll() {
    return this.prisma.product.findMany({
      include: { images: { select: { url: true, key: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { images: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    const slug = (dto as { slug?: string }).slug;
    if (slug) {
      const conflict = await this.prisma.product.findFirst({
        where: { slug, NOT: { id } },
      });
      if (conflict) throw new ConflictException('Slug already in use by another product');
    }

    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: { images: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.product.delete({ where: { id } });
    return { message: 'Product deleted' };
  }
}
