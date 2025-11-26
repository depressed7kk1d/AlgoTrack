import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ 
    example: 'user@algoschool.org',
    description: 'Email пользователя'
  })
  @IsEmail({}, { message: 'Неверный формат email' })
  email: string;

  @ApiProperty({ 
    example: '********',
    description: 'Пароль (минимум 6 символов)'
  })
  @IsString()
  @MinLength(6, { message: 'Пароль должен быть минимум 6 символов' })
  @MaxLength(100)
  password: string;
}
