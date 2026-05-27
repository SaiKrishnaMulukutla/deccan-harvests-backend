import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { RfqModule } from './rfq/rfq.module';
import { CertificationsModule } from './certifications/certifications.module';
import { MediaModule } from './media/media.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SubscribersModule } from './subscribers/subscribers.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  controllers: [AppController],
  imports: [
    AppConfigModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    RfqModule,
    CertificationsModule,
    MediaModule,
    NotificationsModule,
    SubscribersModule,
  ],
  providers: [
    // Apply JwtAuthGuard globally — routes opt-out via @Public()
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
