import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RFQStatus, Role } from '@prisma/client';
import { RfqService } from './rfq.service';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { UpdateRfqStatusDto } from './dto/update-rfq-status.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('rfq')
export class RfqController {
  constructor(private readonly rfqService: RfqService) {}

  // Public — website quote form
  @Public()
  @Post()
  create(@Body() dto: CreateRfqDto) {
    return this.rfqService.create(dto);
  }

  // Admin — list all RFQs with optional filters
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  findAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: RFQStatus,
    @Query('country') country?: string,
  ) {
    return this.rfqService.findAll(pagination, status, country);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  findOne(@Param('id') id: string) {
    return this.rfqService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateRfqStatusDto) {
    return this.rfqService.updateStatus(id, dto);
  }
}
