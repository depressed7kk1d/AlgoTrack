import { IsString, IsBoolean, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAISettingsDto {
  @ApiPropertyOptional({ 
    enum: ['GIGACHAT', 'OPENAI', 'DEEPSEEK', 'YANDEXGPT'],
    description: 'AI провайдер'
  })
  @IsOptional()
  @IsEnum(['GIGACHAT', 'OPENAI', 'DEEPSEEK', 'YANDEXGPT'])
  provider?: 'GIGACHAT' | 'OPENAI' | 'DEEPSEEK' | 'YANDEXGPT';

  @ApiPropertyOptional({ description: 'Включить AI' })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  // ========== GigaChat ==========
  
  @ApiPropertyOptional({ description: 'GigaChat Authorization Key (Base64)' })
  @IsOptional()
  @IsString()
  gigachatAuthKey?: string;

  @ApiPropertyOptional({ 
    enum: ['GIGACHAT_API_PERS', 'GIGACHAT_API_B2B', 'GIGACHAT_API_CORP'],
    description: 'GigaChat Scope (тип подписки)'
  })
  @IsOptional()
  @IsEnum(['GIGACHAT_API_PERS', 'GIGACHAT_API_B2B', 'GIGACHAT_API_CORP'])
  gigachatScope?: 'GIGACHAT_API_PERS' | 'GIGACHAT_API_B2B' | 'GIGACHAT_API_CORP';

  @ApiPropertyOptional({ description: 'GigaChat Model (GigaChat-2, GigaChat-2-Pro, GigaChat-2-Max)' })
  @IsOptional()
  @IsString()
  gigachatModel?: string;

  // ========== OpenAI ==========
  
  @ApiPropertyOptional({ description: 'OpenAI API Key (sk-...)' })
  @IsOptional()
  @IsString()
  openaiApiKey?: string;

  @ApiPropertyOptional({ description: 'OpenAI Model (gpt-3.5-turbo, gpt-4, gpt-4-turbo, gpt-4o)' })
  @IsOptional()
  @IsString()
  openaiModel?: string;

  @ApiPropertyOptional({ description: 'OpenAI Base URL (для прокси)' })
  @IsOptional()
  @IsString()
  openaiBaseUrl?: string;

  // ========== DeepSeek ==========
  
  @ApiPropertyOptional({ description: 'DeepSeek API Key' })
  @IsOptional()
  @IsString()
  deepseekApiKey?: string;

  @ApiPropertyOptional({ description: 'DeepSeek Model (deepseek-chat, deepseek-coder)' })
  @IsOptional()
  @IsString()
  deepseekModel?: string;

  // ========== YandexGPT ==========
  
  @ApiPropertyOptional({ description: 'YandexGPT API Key' })
  @IsOptional()
  @IsString()
  yandexApiKey?: string;

  @ApiPropertyOptional({ description: 'Yandex Cloud Folder ID' })
  @IsOptional()
  @IsString()
  yandexFolderId?: string;

  @ApiPropertyOptional({ description: 'YandexGPT Model (yandexgpt-lite, yandexgpt, yandexgpt-32k)' })
  @IsOptional()
  @IsString()
  yandexModel?: string;

  // ========== Common ==========
  
  @ApiPropertyOptional({ description: 'Temperature (0.0 - 2.0)', minimum: 0, maximum: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({ description: 'Max tokens (100 - 8000)', minimum: 100, maximum: 8000 })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(8000)
  maxTokens?: number;
}
