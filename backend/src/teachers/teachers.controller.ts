import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TeachersService } from './teachers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Teachers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER')
@Controller('teachers')
export class TeachersController {
  constructor(private teachersService: TeachersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Получить текущего учителя' })
  getCurrentTeacher(@Request() req) {
    return this.teachersService.findOne(req.user.id);
  }

  @Get('me/classes')
  @ApiOperation({ summary: 'Получить классы текущего учителя' })
  getMyClasses(@Request() req) {
    return this.teachersService.getTeacherClasses(req.user.id);
  }

  @Get('me/classes/:classId')
  @ApiOperation({ summary: 'Получить детали класса' })
  getClassDetails(@Request() req, @Param('classId') classId: string) {
    return this.teachersService.getClassDetails(req.user.id, classId);
  }
}

