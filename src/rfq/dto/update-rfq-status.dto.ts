import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { RFQStatus } from '@prisma/client';

export class UpdateRfqStatusDto {
  @IsEnum(RFQStatus)
  status: RFQStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  internalNote?: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;
}
