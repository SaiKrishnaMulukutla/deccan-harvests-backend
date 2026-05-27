import { IsEmail, IsString, MinLength, IsEnum, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from '@prisma/client';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,}$/;
const PASSWORD_MESSAGE =
  'Password must be at least 12 characters and contain uppercase, lowercase, digit, and special character';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(12)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password: string;

  @IsEnum(Role)
  role: Role;
}
