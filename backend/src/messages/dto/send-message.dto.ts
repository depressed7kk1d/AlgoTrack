import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ description: 'ID урока' })
  @IsString()
  lessonId: string;

  @ApiProperty({ description: 'ID чата WhatsApp (номер телефона или group ID)' })
  @IsString()
  chatId: string;
}



