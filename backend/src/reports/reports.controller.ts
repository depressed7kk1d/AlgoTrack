import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Сгенерировать итоговую ОС' })
  async generateReport(
    @Body() body: { moduleId: string; studentId: string },
    @CurrentUser() user: any,
  ) {
    // Передаём ID пользователя (админа) для персонализации
    return this.reportsService.generateOsReport(body.moduleId, body.studentId, user.id);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Получить отчеты ученика' })
  async getStudentReports(@Param('studentId') studentId: string) {
    return this.reportsService.getStudentReports(studentId);
  }

  @Get('module/:moduleId')
  @ApiOperation({ summary: 'Получить отчеты по модулю' })
  async getModuleReports(@Param('moduleId') moduleId: string) {
    return this.reportsService.getModuleReports(moduleId);
  }
}



