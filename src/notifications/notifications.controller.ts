import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { NotificationsService } from './notifications.service';
import { SubscribersService } from '../subscribers/subscribers.service';
import { BroadcastDto } from './dto/broadcast.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly subscribers: SubscribersService,
  ) {}

  @Roles('ADMIN')
  @Post('broadcast')
  @HttpCode(HttpStatus.ACCEPTED)
  async broadcast(@Body() dto: BroadcastDto) {
    const subscribers = await this.subscribers.findAllActive();
    if (subscribers.length === 0) return { sent: 0 };

    await this.notifications.sendBroadcast(subscribers, dto.subject, dto.bodyHtml);
    return { sent: subscribers.length };
  }
}
