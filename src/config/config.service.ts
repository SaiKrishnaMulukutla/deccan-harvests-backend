import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import type ms from 'ms';
import { Env } from './env.schema';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: NestConfigService<Env, true>) {}

  get nodeEnv() { return this.config.get('NODE_ENV', { infer: true }); }
  get port()    { return this.config.get('PORT',     { infer: true }); }
  get isProduction() { return this.nodeEnv === 'production'; }

  get frontendUrl() { return this.config.get('FRONTEND_URL', { infer: true }); }
  get databaseUrl() { return this.config.get('DATABASE_URL', { infer: true }); }

  get jwtAccessSecret()  { return this.config.get('JWT_ACCESS_SECRET',  { infer: true }); }
  get jwtRefreshSecret() { return this.config.get('JWT_REFRESH_SECRET', { infer: true }); }
  // Cast to ms.StringValue — safe because env.schema validates the format via Zod
  get jwtAccessExpiry()  { return this.config.get('JWT_ACCESS_EXPIRY',  { infer: true }) as ms.StringValue; }
  get jwtRefreshExpiry() { return this.config.get('JWT_REFRESH_EXPIRY', { infer: true }) as ms.StringValue; }

  get awsRegion()          { return this.config.get('AWS_REGION',            { infer: true }); }
  get awsAccessKeyId()     { return this.config.get('AWS_ACCESS_KEY_ID',     { infer: true }); }
  get awsSecretAccessKey() { return this.config.get('AWS_SECRET_ACCESS_KEY', { infer: true }); }
  get awsS3Bucket()        { return this.config.get('AWS_S3_BUCKET',         { infer: true }); }

  get brevoApiKey()    { return this.config.get('BREVO_API_KEY',    { infer: true }); }
  get brevoFromEmail() { return this.config.get('BREVO_FROM_EMAIL', { infer: true }); }
  get adminEmail()     { return this.config.get('ADMIN_EMAIL',      { infer: true }); }
}
