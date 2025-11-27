import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SuperAdminService } from './super-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

@ApiTags('Super Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('super-admin')
export class SuperAdminController {
  constructor(private superAdminService: SuperAdminService) {}

  // ==================== ADMINS ====================

  @Post('admins')
  @ApiOperation({ summary: 'Создать админа школы' })
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.superAdminService.createAdmin(dto);
  }

  @Get('admins')
  @ApiOperation({ summary: 'Получить всех админов' })
  findAllAdmins() {
    return this.superAdminService.findAllAdmins();
  }

  @Get('admins/:id')
  @ApiOperation({ summary: 'Получить админа по ID' })
  findOneAdmin(@Param('id') id: string) {
    return this.superAdminService.findOneAdmin(id);
  }

  @Patch('admins/:id')
  @ApiOperation({ summary: 'Обновить админа' })
  updateAdmin(@Param('id') id: string, @Body() dto: UpdateAdminDto) {
    return this.superAdminService.updateAdmin(id, dto);
  }

  @Delete('admins/:id')
  @ApiOperation({ summary: 'Деактивировать админа' })
  deleteAdmin(@Param('id') id: string) {
    return this.superAdminService.deleteAdmin(id);
  }

  @Patch('admins/:id/activate')
  @ApiOperation({ summary: 'Активировать админа' })
  activateAdmin(@Param('id') id: string) {
    return this.superAdminService.activateAdmin(id);
  }

  // ==================== MONITORING ====================

  @Get('monitoring/overview')
  @ApiOperation({ summary: 'Общая статистика системы' })
  getMonitoringOverview() {
    return this.superAdminService.getMonitoringOverview();
  }

  @Get('schools')
  @ApiOperation({ summary: 'Список школ/филиалов' })
  getSchoolsList() {
    return this.superAdminService.getSchoolsList();
  }
}

