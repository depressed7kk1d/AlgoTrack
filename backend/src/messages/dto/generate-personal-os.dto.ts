import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GeneratePersonalOSDto {
  @ApiProperty({ description: 'ID модуля' })
  @IsString()
  moduleId: string;

  @ApiProperty({ description: 'ID ученика' })
  @IsString()
  studentId: string;
}

