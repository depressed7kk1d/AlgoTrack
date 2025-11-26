import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class GenerateSummaryDto {
  @ApiProperty({ description: 'ID урока' })
  @IsString()
  lessonId: string;

  @ApiPropertyOptional({ description: 'ID шаблона' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Дата следующего урока' })
  @IsOptional()
  @IsString()
  nextLessonDate?: string;

  @ApiPropertyOptional({ description: 'Использовать AI для генерации', default: false })
  @IsOptional()
  @IsBoolean()
  useAI?: boolean;

  @ApiPropertyOptional({ description: 'Имя преподавателя' })
  @IsOptional()
  @IsString()
  teacherName?: string;

  @ApiPropertyOptional({ description: 'Темы урока (из методички)' })
  @IsOptional()
  @IsString()
  lessonTopics?: string;
}
