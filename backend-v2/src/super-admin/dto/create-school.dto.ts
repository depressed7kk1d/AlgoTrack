import { IsNotEmpty, IsOptional, IsString, MaxLength, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSchoolDto {
  @ApiProperty({ description: 'Название школы' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'Город' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  city: string;

  @ApiPropertyOptional({ description: 'Таймзона', example: 'Europe/Moscow' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ description: 'AI провайдер по умолчанию', example: 'openai' })
  @IsString()
  @IsOptional()
  aiProvider?: string;

  @ApiPropertyOptional({ description: 'Максимум сообщений в час', default: 100 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxMessagesPerHour?: number;

  @ApiPropertyOptional({ description: 'Максимум сообщений в минуту', default: 5 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxMessagesPerMinute?: number;

  @ApiPropertyOptional({ description: 'Пауза между сообщениями (секунды)', default: 20 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  delayBetweenMessages?: number;
}


