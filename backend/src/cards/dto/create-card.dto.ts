import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber, IsArray, IsUrl, MaxLength } from 'class-validator';

export class CreateCardDto {
  @ApiProperty({ description: 'ID урока' })
  @IsString()
  lessonId: string;

  @ApiProperty({ description: 'ID ученика' })
  @IsString()
  studentId: string;

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'], description: 'Уровень активности' })
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'])
  activityLevel: string;

  @ApiProperty({ type: [String], description: 'Навыки', example: ['понимание концепта', 'работа с API'] })
  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @ApiProperty({ enum: ['HAPPY', 'INTERESTED', 'NEUTRAL', 'TIRED', 'DISTRACTED'], description: 'Настроение' })
  @IsEnum(['HAPPY', 'INTERESTED', 'NEUTRAL', 'TIRED', 'DISTRACTED'])
  mood: string;

  @ApiProperty({ description: 'Заметки (200-500 символов)', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  notes: string;

  @ApiProperty({ description: 'Рекомендации', required: false })
  @IsOptional()
  @IsString()
  recommendation?: string;

  @ApiProperty({ description: 'Процент выполнения', required: false, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  percentCompletion?: number;

  @ApiProperty({ description: 'Количество выполненных задач', required: false })
  @IsOptional()
  @IsNumber()
  taskCompletedCount?: number;

  @ApiProperty({ description: 'Общее количество задач на урок', required: false })
  @IsOptional()
  @IsNumber()
  taskTotalForLesson?: number;

  @ApiProperty({ description: 'Ссылка на внешний проект', required: false })
  @IsOptional()
  @IsUrl()
  externalProjectLink?: string;
}



