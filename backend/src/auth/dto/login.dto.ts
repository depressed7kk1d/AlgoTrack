import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'alexander@algoschool.org' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'teacher123' })
  @IsString()
  @MinLength(6)
  password: string;
}



