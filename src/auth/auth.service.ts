import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import { PrismaService } from '../database/prisma.service';
import { AppConfigService } from '../config/config.service';
import { JwtPayload } from './strategies/jwt.strategy';

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
  ) {}

  async validateCredentials(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.isActive) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    return { id: user.id, email: user.email, role: user.role };
  }

  async login(userId: string, email: string, role: string, res: Response) {
    const payload: JwtPayload = { sub: userId, email, role };

    const accessToken = this.jwt.sign(payload as object, {
      secret: this.config.jwtAccessSecret,
      expiresIn: '15m',
    });

    const refreshToken = this.jwt.sign(payload as object, {
      secret: this.config.jwtRefreshSecret,
      expiresIn: '7d',
    });

    const accessMs  = 15 * 60 * 1000;           // 15 min
    const refreshMs = 7 * 24 * 60 * 60 * 1000;  // 7 days

    res.cookie('access_token',  accessToken,  { ...COOKIE_BASE, maxAge: accessMs  });
    res.cookie('refresh_token', refreshToken, { ...COOKIE_BASE, maxAge: refreshMs });

    return { id: userId, email, role };
  }

  async refresh(refreshToken: string, res: Response) {
    let payload: JwtPayload;

    try {
      payload = this.jwt.verify<JwtPayload>(refreshToken, {
        secret: this.config.jwtRefreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or deactivated');
    }

    return this.login(user.id, user.email, user.role, res);
  }

  logout(res: Response) {
    res.cookie('access_token',  '', { ...COOKIE_BASE, maxAge: 0 });
    res.cookie('refresh_token', '', { ...COOKIE_BASE, maxAge: 0 });
  }
}
