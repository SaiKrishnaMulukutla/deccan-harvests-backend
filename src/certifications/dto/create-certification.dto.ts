import { IsString, IsOptional, IsDateString, IsBoolean, MinLength } from 'class-validator';

export class CreateCertificationDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(2)
  issuingBody: string;

  @IsOptional()
  @IsString()
  certNumber?: string;

  @IsDateString()
  issuedAt: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsString()
  fileUrl: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
