import { IsString, IsOptional, IsEmail, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ParentType } from '@prisma/client';

export class CreateStudentDto {
  @ApiProperty({ description: 'Имя ученика' })
  @IsString()
  studentName: string;

  @ApiPropertyOptional({ description: 'Дата рождения (ISO string)' })
  @IsOptional()
  @IsDateString()
  studentDob?: string;

  @ApiProperty({ description: 'Имя родителя' })
  @IsString()
  parentName: string;

  @ApiPropertyOptional({ description: 'Телефон родителя (WhatsApp)' })
  @IsOptional()
  @IsString()
  parentPhone?: string;

  @ApiPropertyOptional({ description: 'Email родителя' })
  @IsOptional()
  @IsEmail()
  parentEmail?: string;

  @ApiPropertyOptional({ 
    description: 'Тип родителя',
    enum: ParentType,
  })
  @IsOptional()
  @IsEnum(ParentType)
  parentType?: ParentType;
}

