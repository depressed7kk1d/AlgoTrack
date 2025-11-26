import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Classes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('classes')
export class ClassesController {
  constructor(private classesService: ClassesService) {}

  @Get()
  @ApiOperation({ summary: 'Получить список классов учителя' })
  async findAll(@CurrentUser() user: any) {
    return this.classesService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить класс с деталями' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.classesService.findOne(id, user.id);
  }

  @Get(':id/students')
  @ApiOperation({ summary: 'Получить учеников класса с прогрессом' })
  async getStudentsWithProgress(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.classesService.getStudentsWithProgress(id, user.id);
  }
}



