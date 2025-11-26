import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClassDto {
  @ApiProperty({ description: 'Название класса', example: 'Python Начинающие 10:00' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'Описание класса' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'ID WhatsApp группы', example: '79991234567-1234567890@g.us' })
  @IsString()
  @IsOptional()
  whatsappGroupId?: string;

  @ApiPropertyOptional({ description: 'Название WhatsApp группы' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  whatsappGroupName?: string;

  @ApiPropertyOptional({ description: 'Ссылка на WhatsApp группу' })
  @IsString()
  @IsOptional()
  whatsappGroupLink?: string;

  @ApiPropertyOptional({ description: 'ID учителя (если не указан, используется текущий пользователь)' })
  @IsString()
  @IsOptional()
  teacherId?: string;
}

