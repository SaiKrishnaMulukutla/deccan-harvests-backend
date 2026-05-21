import { IsString, IsOptional, IsInt, IsEnum, MinLength, Min } from 'class-validator';
import { ProductStatus } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(2)
  slug: string;

  @IsOptional()
  @IsString()
  variety?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  shuMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  shuMax?: number;

  @IsOptional()
  @IsString()
  astaValue?: string;

  @IsOptional()
  @IsString()
  moisture?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
