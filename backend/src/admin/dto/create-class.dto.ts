import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClassDto {
  @ApiProperty({ description: 'Название класса/группы' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'ID учителя' })
  @IsString()
  teacherId: string;

  @ApiPropertyOptional({ description: 'Расписание (JSON объект)' })
  @IsOptional()
  @IsObject()
  schedule?: { day: string; time: string; duration?: string };

  @ApiPropertyOptional({ description: 'ID группы WhatsApp (для GreenAPI)' })
  @IsOptional()
  @IsString()
  whatsappGroupId?: string;

  @ApiPropertyOptional({ description: 'Название группы WhatsApp' })
  @IsOptional()
  @IsString()
  whatsappGroupName?: string;
}

