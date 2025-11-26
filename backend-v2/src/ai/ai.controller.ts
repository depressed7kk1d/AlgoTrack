import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(
    private aiService: AiService,
    private prisma: PrismaService,
  ) {}

  @Post('generate-lesson-summary')
  @ApiOperation({ summary: 'Генерация ОС после урока через AI' })
  async generateLessonSummary(@Request() req, @Body() data: { 
    lessonId: string; 
    teacherName: string; 
    lessonTopic: string; 
    nextLessonDate?: string;
    scheduledAt?: string;
  }) {
    // Получаем урок
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: data.lessonId },
      include: { class: true },
    });

    if (!lesson) {
      throw new Error('Урок не найден');
    }

    // Генерируем ОС
    const content = await this.aiService.generateLessonSummary(req.user.schoolId, {
      teacherName: data.teacherName,
      lessonTopic: data.lessonTopic,
      nextLessonDate: data.nextLessonDate,
    });

    // Определяем scheduledAt
    const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
    const nextLessonDateObj = data.nextLessonDate ? new Date(data.nextLessonDate) : null;

    // Сохраняем или обновляем LessonSummary
    const summary = await this.prisma.lessonSummary.upsert({
      where: { lessonId: data.lessonId },
      update: {
        content,
        teacherName: data.teacherName,
        nextLessonDate: nextLessonDateObj,
        scheduledAt,
        status: scheduledAt && scheduledAt > new Date() ? 'PENDING' : 'PENDING',
      },
      create: {
        lessonId: data.lessonId,
        content,
        teacherName: data.teacherName,
        nextLessonDate: nextLessonDateObj,
        scheduledAt,
        status: 'PENDING',
      },
    });

    return summary;
  }

  @Post('generate-personal-report')
  @ApiOperation({ summary: 'Генерация персональной ОС по 4 урокам через AI' })
  async generatePersonalReport(@Request() req, @Body() data: any) {
    return {
      content: await this.aiService.generatePersonalReport(req.user.schoolId, data),
    };
  }
}

