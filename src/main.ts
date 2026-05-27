import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser') as () => ReturnType<typeof import('cookie-parser')>;
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Graceful shutdown (SIGTERM / SIGINT) ──
  app.enableShutdownHooks();

  // ── Security headers ──
  app.use(helmet());

  // ── Cookie parser (required for JWT cookie strategy) ──
  app.use(cookieParser());

  // ── Global rate limit: 200 req / 15 min per IP ──
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // ── Stricter rate limit on auth routes ──
  app.use(
    '/api/v1/auth',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many login attempts. Try again later.' } },
    }),
  );

  // ── Stricter rate limit on public RFQ ──
  app.use(
    '/api/v1/rfq',
    rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 10,
      message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many quote requests. Try again later.' } },
    }),
  );

  // ── Stricter rate limit on user creation (admin route, brute-force guard) ──
  app.use(
    '/api/v1/users',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests. Try again later.' } },
    }),
  );

  // ── CORS — whitelist frontend origin only ──
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
  });

  // ── Global prefix ──
  app.setGlobalPrefix('api/v1');

  // ── Global validation pipe ──
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── Global exception filter ──
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── Global response transform interceptor ──
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Deccan Harvests API running on :${port}`);
}

bootstrap();
