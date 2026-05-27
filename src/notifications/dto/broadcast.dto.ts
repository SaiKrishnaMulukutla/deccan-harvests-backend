import { IsString, MinLength, MaxLength } from 'class-validator';

export class BroadcastDto {
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  subject: string;

  @IsString()
  @MinLength(10)
  bodyHtml: string;
}
