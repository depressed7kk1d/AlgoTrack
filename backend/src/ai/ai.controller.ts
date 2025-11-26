import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateAISettingsDto } from './dto/update-ai-settings.dto';
import { GenerateTextDto } from './dto/generate-text.dto';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AIController {
  constructor(private aiService: AIService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Получить настройки AI' })
  async getSettings() {
    const settings = await this.aiService.getSettings();
    // Hide sensitive keys in response (show only if configured)
    return {
      id: settings.id,
      provider: settings.provider,
      isEnabled: settings.isEnabled,
      // GigaChat
      gigachatAuthKey: settings.gigachatAuthKey ? '***configured***' : null,
      gigachatScope: settings.gigachatScope,
      gigachatModel: settings.gigachatModel,
      // OpenAI
      openaiApiKey: settings.openaiApiKey ? '***configured***' : null,
      openaiModel: settings.openaiModel,
      openaiBaseUrl: settings.openaiBaseUrl,
      // DeepSeek
      deepseekApiKey: settings.deepseekApiKey ? '***configured***' : null,
      deepseekModel: settings.deepseekModel,
      // YandexGPT
      yandexApiKey: settings.yandexApiKey ? '***configured***' : null,
      yandexFolderId: settings.yandexFolderId ? '***configured***' : null,
      yandexModel: settings.yandexModel,
      // Common
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Обновить настройки AI' })
  async updateSettings(@Body() dto: UpdateAISettingsDto) {
    const settings = await this.aiService.updateSettings(dto);
    return {
      id: settings.id,
      provider: settings.provider,
      isEnabled: settings.isEnabled,
      gigachatAuthKey: settings.gigachatAuthKey ? '***configured***' : null,
      gigachatScope: settings.gigachatScope,
      gigachatModel: settings.gigachatModel,
      openaiApiKey: settings.openaiApiKey ? '***configured***' : null,
      openaiModel: settings.openaiModel,
      openaiBaseUrl: settings.openaiBaseUrl,
      deepseekApiKey: settings.deepseekApiKey ? '***configured***' : null,
      deepseekModel: settings.deepseekModel,
      yandexApiKey: settings.yandexApiKey ? '***configured***' : null,
      yandexFolderId: settings.yandexFolderId ? '***configured***' : null,
      yandexModel: settings.yandexModel,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
    };
  }

  @Post('test')
  @ApiOperation({ summary: 'Тест подключения к AI' })
  async testConnection() {
    return this.aiService.testConnection();
  }

  @Post('generate')
  @ApiOperation({ summary: 'Сгенерировать текст с помощью AI' })
  async generateText(@Body() dto: GenerateTextDto) {
    const response = await this.aiService.generate({
      prompt: dto.prompt,
      systemPrompt: dto.systemPrompt,
      temperature: dto.temperature,
      maxTokens: dto.maxTokens,
    });
    return response;
  }

  @Get('providers')
  @ApiOperation({ summary: 'Получить список доступных AI провайдеров с их настройками' })
  async getProviders() {
    return [
      {
        id: 'GIGACHAT',
        name: 'GigaChat (Сбер)',
        description: 'Российская нейросеть от Сбербанка. Работает без VPN.',
        authType: 'OAuth2 (Authorization Key → Access Token)',
        requiredFields: ['gigachatAuthKey'],
        optionalFields: ['gigachatScope', 'gigachatModel'],
        models: [
          { id: 'GigaChat-2', name: 'GigaChat 2', description: 'Быстрая, для простых задач' },
          { id: 'GigaChat-2-Pro', name: 'GigaChat 2 Pro', description: 'Улучшенное качество' },
          { id: 'GigaChat-2-Max', name: 'GigaChat 2 Max', description: 'Максимальное качество' },
        ],
        scopes: [
          { id: 'GIGACHAT_API_PERS', name: 'Физ. лица', description: 'Для физических лиц' },
          { id: 'GIGACHAT_API_B2B', name: 'ИП/Юр. лица (пакеты)', description: 'Платные пакеты' },
          { id: 'GIGACHAT_API_CORP', name: 'ИП/Юр. лица (pay-as-you-go)', description: 'Оплата по факту' },
        ],
        howToGet: 'developers.sber.ru → GigaChat API → Получить ключ авторизации',
        pricing: 'Бесплатно для физ. лиц (лимиты), платно для бизнеса',
      },
      {
        id: 'OPENAI',
        name: 'OpenAI (ChatGPT)',
        description: 'GPT модели от OpenAI. Лучшее качество, требует VPN в РФ.',
        authType: 'Bearer Token',
        requiredFields: ['openaiApiKey'],
        optionalFields: ['openaiModel', 'openaiBaseUrl'],
        models: [
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Быстрая и дешёвая' },
          { id: 'gpt-4', name: 'GPT-4', description: 'Высокое качество' },
          { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Улучшенная GPT-4' },
          { id: 'gpt-4o', name: 'GPT-4o', description: 'Новейшая модель' },
        ],
        howToGet: 'platform.openai.com → API Keys → Create new secret key',
        pricing: 'Платно (pay-as-you-go)',
      },
      {
        id: 'DEEPSEEK',
        name: 'DeepSeek',
        description: 'Китайская нейросеть. Дешевле OpenAI, хорошее качество.',
        authType: 'Bearer Token (OpenAI-совместимый)',
        requiredFields: ['deepseekApiKey'],
        optionalFields: ['deepseekModel'],
        models: [
          { id: 'deepseek-chat', name: 'DeepSeek Chat', description: 'Для диалогов' },
          { id: 'deepseek-coder', name: 'DeepSeek Coder', description: 'Для кода' },
        ],
        howToGet: 'api.deepseek.com → Создать API Key',
        pricing: 'Платно (дешевле OpenAI)',
      },
      {
        id: 'YANDEXGPT',
        name: 'YandexGPT',
        description: 'Российская нейросеть от Яндекса. Работает без VPN.',
        authType: 'API Key + Folder ID',
        requiredFields: ['yandexApiKey', 'yandexFolderId'],
        optionalFields: ['yandexModel'],
        models: [
          { id: 'yandexgpt-lite', name: 'YandexGPT Lite', description: 'Быстрая, для простых задач' },
          { id: 'yandexgpt', name: 'YandexGPT', description: 'Стандартная модель' },
          { id: 'yandexgpt-32k', name: 'YandexGPT 32K', description: 'Большой контекст' },
        ],
        howToGet: 'console.cloud.yandex.ru → Сервисные аккаунты → API-ключ + ID каталога',
        pricing: 'Платно (pay-as-you-go)',
      },
    ];
  }
}
