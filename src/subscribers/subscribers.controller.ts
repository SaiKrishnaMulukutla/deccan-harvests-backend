import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { SubscribersService } from './subscribers.service';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';

@Controller('subscribers')
export class SubscribersController {
  constructor(private readonly subscribers: SubscribersService) {}

  @Public()
  @Post()
  subscribe(@Body() dto: CreateSubscriberDto) {
    return this.subscribers.subscribe(dto);
  }

  @Roles('ADMIN', 'MANAGER')
  @Get()
  findAll() {
    return this.subscribers.findAllActive();
  }

  @Roles('ADMIN')
  @Delete(':email')
  unsubscribe(@Param('email') email: string) {
    return this.subscribers.unsubscribe(email);
  }
}
