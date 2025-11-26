import { IsString, IsPhoneNumber, IsEnum, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({ example: 'Иванов Петр' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Иванова Мария' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  parentName: string;

  @ApiProperty({ example: '+79991234567' })
  @IsString()
  @MinLength(11)
  @MaxLength(20)
  parentPhone: string;

  @ApiProperty({ enum: ['CALM', 'ANXIOUS', 'DEMANDING'], default: 'CALM' })
  @IsOptional()
  @IsEnum(['CALM', 'ANXIOUS', 'DEMANDING'])
  parentType?: string;
}

