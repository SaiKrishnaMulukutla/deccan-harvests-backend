import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { SchedulerService } from './scheduler.service';
import { SubscribersModule } from '../subscribers/subscribers.module';

@Module({
  imports: [SubscribersModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, SchedulerService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
