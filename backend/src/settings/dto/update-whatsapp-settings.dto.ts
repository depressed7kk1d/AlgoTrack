import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWhatsAppSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ description: 'GreenAPI Instance ID' })
  @IsOptional()
  @IsString()
  greenApiId?: string;

  @ApiPropertyOptional({ description: 'GreenAPI Token' })
  @IsOptional()
  @IsString()
  greenApiToken?: string;
}

