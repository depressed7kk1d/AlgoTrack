import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminsService } from './admins.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminsController {
  constructor(
    private adminsService: AdminsService,
    private whatsappService: WhatsAppService,
  ) {}

  @Post('teachers')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Создать учителя (только Admin)' })
  async createTeacher(@Request() req, @Body() data: any) {
    return this.adminsService.createTeacher(req.user.schoolId, data);
  }

  @Get('reports/ready')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Список готовых ОС по 4 урокам' })
  async getReadyReports(@Request() req) {
    return this.adminsService.getReadyReports(req.user.schoolId);
  }

  @Post('reports/:id/generate')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Сгенерировать персональную ОС' })
  async generateReport(
    @Request() req,
    @Param('id') reportId: string,
    @Body() data: { managerName: string }
  ) {
    return this.adminsService.generateReport(req.user.schoolId, reportId, data.managerName);
  }

  @Post('reports/:id/send')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Отправить персональную ОС родителю' })
  async sendReport(@Request() req, @Param('id') reportId: string) {
    return this.adminsService.sendReport(req.user.schoolId, reportId, this.whatsappService);
  }

  @Patch('settings')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Обновить настройки школы' })
  async updateSettings(@Request() req, @Body() data: any) {
    return this.adminsService.updateSettings(req.user.schoolId, data);
  }

  @Get('whatsapp/groups')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Список групп WhatsApp' })
  async getWhatsAppGroups(@Request() req) {
    return this.whatsappService.getChats(req.user.schoolId);
  }
}

