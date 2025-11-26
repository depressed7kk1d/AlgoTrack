import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BroadcastService } from './broadcast.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Broadcast')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('broadcast')
export class BroadcastController {
  constructor(private broadcastService: BroadcastService) {}

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Создать рассылку' })
  createBroadcast(
    @Request() req,
    @Body() dto: {
      name: string;
      messages: Array<{ text: string; imageUrl?: string }>;
      targetType: 'ALL_GROUPS' | 'SELECTED_GROUPS' | 'ALL_PARENTS';
      targetIds?: string[];
      scheduledFor?: string;
    },
  ) {
    return this.broadcastService.createBroadcast({
      ...dto,
      scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
      adminId: req.user.id,
    });
  }

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Получить список рассылок' })
  getBroadcasts(@Request() req) {
    return this.broadcastService.getAdminBroadcasts(req.user.id);
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Получить детали рассылки' })
  getBroadcastDetails(@Request() req, @Param('id') id: string) {
    return this.broadcastService.getBroadcastDetails(id, req.user.id);
  }

  @Post(':id/start')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Запустить рассылку' })
  startBroadcast(@Request() req, @Param('id') id: string) {
    return this.broadcastService.startBroadcast(id, req.user.id);
  }

  @Post(':id/cancel')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Отменить рассылку' })
  cancelBroadcast(@Request() req, @Param('id') id: string) {
    return this.broadcastService.cancelBroadcast(id, req.user.id);
  }
}

