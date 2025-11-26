import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClassDto {
  @ApiPropertyOptional({ description: 'Название класса' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: 'Описание класса' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'ID WhatsApp группы' })
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
}

