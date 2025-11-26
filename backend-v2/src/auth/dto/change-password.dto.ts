import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Текущий пароль' })
  @IsString()
  @MinLength(6)
  currentPassword: string;

  @ApiProperty({ description: 'Новый пароль' })
  @IsString()
  @MinLength(6, { message: 'Новый пароль должен быть минимум 6 символов' })
  @MaxLength(100)
  newPassword: string;
}

