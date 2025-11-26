import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SuperAdminService } from './super-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { UpdateIntegrationsDto } from './dto/update-integrations.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

@ApiTags('Super Admin')
@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@ApiBearerAuth()
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('schools')
  @ApiOperation({ summary: 'Список всех школ' })
  async getSchools() {
    return this.superAdminService.getSchools();
  }

  @Get('schools/:id')
  @ApiOperation({ summary: 'Детали школы' })
  async getSchool(@Param('id') id: string) {
    return this.superAdminService.getSchoolById(id);
  }

  @Post('schools')
  @ApiOperation({ summary: 'Создать школу' })
  async createSchool(@Body() dto: CreateSchoolDto) {
    return this.superAdminService.createSchool(dto);
  }

  @Patch('schools/:id')
  @ApiOperation({ summary: 'Обновить школу' })
  async updateSchool(@Param('id') id: string, @Body() dto: UpdateSchoolDto) {
    return this.superAdminService.updateSchool(id, dto);
  }

  @Patch('schools/:id/integrations')
  @ApiOperation({ summary: 'Обновить токены/интеграции школы' })
  async updateIntegrations(@Param('id') id: string, @Body() dto: UpdateIntegrationsDto) {
    return this.superAdminService.updateIntegrations(id, dto);
  }

  @Delete('schools/:id')
  @ApiOperation({ summary: 'Удалить школу' })
  async deleteSchool(@Param('id') id: string) {
    return this.superAdminService.deleteSchool(id);
  }

  @Get('admins')
  @ApiOperation({ summary: 'Список админов' })
  async getAdmins() {
    return this.superAdminService.getAdmins();
  }

  @Post('admins')
  @ApiOperation({ summary: 'Создать админа школы' })
  async createAdmin(@Body() dto: CreateAdminDto) {
    return this.superAdminService.createAdmin(dto);
  }

  @Patch('admins/:id')
  @ApiOperation({ summary: 'Обновить админа' })
  async updateAdmin(@Param('id') id: string, @Body() dto: UpdateAdminDto) {
    return this.superAdminService.updateAdmin(id, dto);
  }

  @Delete('admins/:id')
  @ApiOperation({ summary: 'Удалить админа' })
  async deleteAdmin(@Param('id') id: string) {
    return this.superAdminService.deleteAdmin(id);
  }

  @Get('monitoring/overview')
  @ApiOperation({ summary: 'Мониторинг очередей и ошибок' })
  async getMonitoringOverview() {
    return this.superAdminService.getMonitoringOverview();
  }
}


