import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateIntegrationsDto {
  @ApiPropertyOptional({ description: 'GreenAPI Instance ID' })
  @IsString()
  @IsOptional()
  greenApiInstanceId?: string;

  @ApiPropertyOptional({ description: 'GreenAPI Token' })
  @IsString()
  @IsOptional()
  greenApiToken?: string;

  @ApiPropertyOptional({ description: 'GreenAPI Instance ID (резерв)' })
  @IsString()
  @IsOptional()
  greenApiInstanceId2?: string;

  @ApiPropertyOptional({ description: 'GreenAPI Token (резерв)' })
  @IsString()
  @IsOptional()
  greenApiToken2?: string;

  @ApiPropertyOptional({ description: 'AI провайдер' })
  @IsString()
  @IsOptional()
  aiProvider?: string;

  @ApiPropertyOptional({ description: 'API ключ для AI' })
  @IsString()
  @IsOptional()
  aiApiKey?: string;
}


