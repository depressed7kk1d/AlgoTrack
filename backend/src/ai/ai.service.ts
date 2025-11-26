import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as https from 'https';
import * as crypto from 'crypto';

export interface AIGenerateOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  text: string;
  provider: string;
  model?: string;
  tokensUsed?: number;
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  
  // GigaChat token cache
  private gigachatAccessToken: string | null = null;
  private gigachatTokenExpiresAt: number = 0;

  // Axios instance for GigaChat (needs custom HTTPS agent)
  private gigachatAxios: AxiosInstance;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    // GigaChat requires SSL verification disabled
    this.gigachatAxios = axios.create({
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 30000,
    });
  }

  /**
   * Generate text using configured AI provider
   */
  async generate(options: AIGenerateOptions): Promise<AIResponse> {
    const settings = await this.getSettings();
    
    if (!settings || !settings.isEnabled) {
      throw new Error('AI service is disabled. Enable it in Settings.');
    }

    this.logger.log(`Generating text with provider: ${settings.provider}`);

    switch (settings.provider) {
      case 'GIGACHAT':
        return this.generateWithGigaChat(options, settings);
      case 'OPENAI':
        return this.generateWithOpenAI(options, settings);
      case 'DEEPSEEK':
        return this.generateWithDeepSeek(options, settings);
      case 'YANDEXGPT':
        return this.generateWithYandexGPT(options, settings);
      default:
        throw new Error(`Unknown AI provider: ${settings.provider}`);
    }
  }

  /**
   * Get current AI settings
   */
  async getSettings() {
    let settings = await this.prisma.aISettings.findFirst();
    
    if (!settings) {
      settings = await this.prisma.aISettings.create({
        data: {
          provider: 'GIGACHAT',
          isEnabled: false,
          gigachatScope: 'GIGACHAT_API_PERS',
          gigachatModel: 'GigaChat-2',
          openaiModel: 'gpt-3.5-turbo',
          deepseekModel: 'deepseek-chat',
          yandexModel: 'yandexgpt-lite',
          temperature: 0.7,
          maxTokens: 1500,
        },
      });
    }
    
    return settings;
  }

  /**
   * Update AI settings
   */
  async updateSettings(data: {
    provider?: 'GIGACHAT' | 'OPENAI' | 'DEEPSEEK' | 'YANDEXGPT';
    isEnabled?: boolean;
    // GigaChat
    gigachatAuthKey?: string;
    gigachatScope?: 'GIGACHAT_API_PERS' | 'GIGACHAT_API_B2B' | 'GIGACHAT_API_CORP';
    gigachatModel?: string;
    // OpenAI
    openaiApiKey?: string;
    openaiModel?: string;
    openaiBaseUrl?: string;
    // DeepSeek
    deepseekApiKey?: string;
    deepseekModel?: string;
    // YandexGPT
    yandexApiKey?: string;
    yandexFolderId?: string;
    yandexModel?: string;
    // Common
    temperature?: number;
    maxTokens?: number;
  }) {
    const settings = await this.getSettings();
    
    // Reset token cache if GigaChat key changed
    if (data.gigachatAuthKey) {
      this.gigachatAccessToken = null;
      this.gigachatTokenExpiresAt = 0;
    }
    
    return this.prisma.aISettings.update({
      where: { id: settings.id },
      data,
    });
  }

  /**
   * Test AI connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; provider: string; model?: string }> {
    try {
      const settings = await this.getSettings();
      
      if (!settings.isEnabled) {
        return { success: false, message: 'AI service is disabled', provider: settings.provider };
      }

      // Validate required credentials
      const validation = this.validateCredentials(settings);
      if (!validation.valid) {
        return { success: false, message: validation.message, provider: settings.provider };
      }

      const response = await this.generate({
        prompt: 'Ответь одним словом: работает',
        maxTokens: 50,
      });

      return {
        success: true,
        message: `✅ Успешно! Ответ: "${response.text.substring(0, 100)}"`,
        provider: settings.provider,
        model: response.model,
      };
    } catch (error: any) {
      this.logger.error('Test connection failed:', error.message);
      return {
        success: false,
        message: `❌ Ошибка: ${error.message}`,
        provider: 'unknown',
      };
    }
  }

  /**
   * Validate credentials for current provider
   */
  private validateCredentials(settings: any): { valid: boolean; message: string } {
    switch (settings.provider) {
      case 'GIGACHAT':
        if (!settings.gigachatAuthKey) {
          return { valid: false, message: 'GigaChat: не указан Authorization Key' };
        }
        break;
      case 'OPENAI':
        if (!settings.openaiApiKey) {
          return { valid: false, message: 'OpenAI: не указан API Key' };
        }
        break;
      case 'DEEPSEEK':
        if (!settings.deepseekApiKey) {
          return { valid: false, message: 'DeepSeek: не указан API Key' };
        }
        break;
      case 'YANDEXGPT':
        if (!settings.yandexApiKey || !settings.yandexFolderId) {
          return { valid: false, message: 'YandexGPT: не указан API Key или Folder ID' };
        }
        break;
    }
    return { valid: true, message: 'OK' };
  }

  // ==================== GigaChat (Сбер) ====================
  // OAuth2 авторизация: сначала получаем Access Token, потом делаем запросы

  private async generateWithGigaChat(
    options: AIGenerateOptions,
    settings: any,
  ): Promise<AIResponse> {
    if (!settings.gigachatAuthKey) {
      throw new Error('GigaChat: Authorization Key не настроен');
    }

    // Step 1: Get Access Token (OAuth2)
    const accessToken = await this.getGigaChatAccessToken(
      settings.gigachatAuthKey,
      settings.gigachatScope || 'GIGACHAT_API_PERS',
    );
    
    // Step 2: Build messages
    const messages = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: options.prompt });

    const model = settings.gigachatModel || 'GigaChat-2';

    try {
      this.logger.log(`GigaChat: Sending request to model ${model}`);
      
      const response = await this.gigachatAxios.post(
        'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
        {
          model,
          messages,
          temperature: options.temperature ?? settings.temperature,
          max_tokens: options.maxTokens ?? settings.maxTokens,
          n: 1,
          stream: false,
          repetition_penalty: 1,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        },
      );

      const text = response.data.choices[0]?.message?.content?.trim();
      if (!text) {
        throw new Error('Empty response from GigaChat');
      }

      return {
        text,
        provider: 'GIGACHAT',
        model,
        tokensUsed: response.data.usage?.total_tokens,
      };
    } catch (error: any) {
      this.logger.error('GigaChat API error:', error.response?.data || error.message);
      throw new Error(`GigaChat: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get GigaChat Access Token via OAuth2
   * Token is valid for 30 minutes, we cache it for 25 minutes
   */
  private async getGigaChatAccessToken(authKey: string, scope: string): Promise<string> {
    // Check if cached token is still valid
    if (this.gigachatAccessToken && Date.now() < this.gigachatTokenExpiresAt) {
      this.logger.debug('Using cached GigaChat access token');
      return this.gigachatAccessToken;
    }

    this.logger.log('Requesting new GigaChat access token...');

    try {
      const response = await this.gigachatAxios.post(
        'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
        `scope=${scope}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'RqUID': crypto.randomUUID(), // Required unique request ID
            'Authorization': `Basic ${authKey}`,
          },
        },
      );

      if (!response.data.access_token) {
        throw new Error('No access_token in response');
      }

      this.gigachatAccessToken = response.data.access_token;
      // Token valid for 30 minutes, refresh after 25 to be safe
      this.gigachatTokenExpiresAt = Date.now() + 25 * 60 * 1000;
      
      this.logger.log('✅ GigaChat access token obtained successfully');
      return this.gigachatAccessToken;
    } catch (error: any) {
      this.logger.error('Failed to get GigaChat access token:', error.response?.data || error.message);
      // Reset cache on error
      this.gigachatAccessToken = null;
      this.gigachatTokenExpiresAt = 0;
      throw new Error(`GigaChat OAuth: ${error.response?.data?.error || error.message}`);
    }
  }

  // ==================== OpenAI (ChatGPT) ====================
  // Simple Bearer token authentication

  private async generateWithOpenAI(
    options: AIGenerateOptions,
    settings: any,
  ): Promise<AIResponse> {
    if (!settings.openaiApiKey) {
      throw new Error('OpenAI: API Key не настроен');
    }

    const messages = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: options.prompt });

    const model = settings.openaiModel || 'gpt-3.5-turbo';
    const baseUrl = settings.openaiBaseUrl || 'https://api.openai.com/v1';

    try {
      this.logger.log(`OpenAI: Sending request to model ${model}`);

      const response = await axios.post(
        `${baseUrl}/chat/completions`,
        {
          model,
          messages,
          temperature: options.temperature ?? settings.temperature,
          max_tokens: options.maxTokens ?? settings.maxTokens,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.openaiApiKey}`,
          },
          timeout: 60000,
        },
      );

      const text = response.data.choices[0]?.message?.content?.trim();
      if (!text) {
        throw new Error('Empty response from OpenAI');
      }

      return {
        text,
        provider: 'OPENAI',
        model,
        tokensUsed: response.data.usage?.total_tokens,
      };
    } catch (error: any) {
      this.logger.error('OpenAI API error:', error.response?.data || error.message);
      throw new Error(`OpenAI: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // ==================== DeepSeek ====================
  // OpenAI-compatible API

  private async generateWithDeepSeek(
    options: AIGenerateOptions,
    settings: any,
  ): Promise<AIResponse> {
    if (!settings.deepseekApiKey) {
      throw new Error('DeepSeek: API Key не настроен');
    }

    const messages = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: options.prompt });

    const model = settings.deepseekModel || 'deepseek-chat';

    try {
      this.logger.log(`DeepSeek: Sending request to model ${model}`);

      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model,
          messages,
          temperature: options.temperature ?? settings.temperature,
          max_tokens: options.maxTokens ?? settings.maxTokens,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.deepseekApiKey}`,
          },
          timeout: 60000,
        },
      );

      const text = response.data.choices[0]?.message?.content?.trim();
      if (!text) {
        throw new Error('Empty response from DeepSeek');
      }

      return {
        text,
        provider: 'DEEPSEEK',
        model,
        tokensUsed: response.data.usage?.total_tokens,
      };
    } catch (error: any) {
      this.logger.error('DeepSeek API error:', error.response?.data || error.message);
      throw new Error(`DeepSeek: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // ==================== YandexGPT ====================
  // Uses IAM Token or API Key + Folder ID

  private async generateWithYandexGPT(
    options: AIGenerateOptions,
    settings: any,
  ): Promise<AIResponse> {
    if (!settings.yandexApiKey || !settings.yandexFolderId) {
      throw new Error('YandexGPT: API Key или Folder ID не настроены');
    }

    const messages = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', text: options.systemPrompt });
    }
    messages.push({ role: 'user', text: options.prompt });

    // Map model name to full URI
    const modelUri = this.getYandexModelUri(settings.yandexFolderId, settings.yandexModel || 'yandexgpt-lite');

    try {
      this.logger.log(`YandexGPT: Sending request to model ${settings.yandexModel}`);

      const response = await axios.post(
        'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
        {
          modelUri,
          completionOptions: {
            stream: false,
            temperature: options.temperature ?? settings.temperature,
            maxTokens: String(options.maxTokens ?? settings.maxTokens),
          },
          messages,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Api-Key ${settings.yandexApiKey}`,
            'x-folder-id': settings.yandexFolderId,
          },
          timeout: 60000,
        },
      );

      const text = response.data.result?.alternatives?.[0]?.message?.text?.trim();
      if (!text) {
        throw new Error('Empty response from YandexGPT');
      }

      return {
        text,
        provider: 'YANDEXGPT',
        model: settings.yandexModel,
        tokensUsed: parseInt(response.data.result?.usage?.totalTokens) || undefined,
      };
    } catch (error: any) {
      this.logger.error('YandexGPT API error:', error.response?.data || error.message);
      throw new Error(`YandexGPT: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  private getYandexModelUri(folderId: string, model: string): string {
    // Full URI format: gpt://<folder_id>/<model_name>/<model_version>
    const modelMap: Record<string, string> = {
      'yandexgpt-lite': `gpt://${folderId}/yandexgpt-lite/latest`,
      'yandexgpt': `gpt://${folderId}/yandexgpt/latest`,
      'yandexgpt-32k': `gpt://${folderId}/yandexgpt-32k/latest`,
    };
    return modelMap[model] || `gpt://${folderId}/${model}/latest`;
  }

  // ==================== Text Generation Helpers ====================

  /**
   * Generate class summary using AI
   */
  async generateClassSummary(data: {
    teacherName: string;
    className: string;
    lessonTopic: string;
    lessonDescription?: string;
    students: Array<{
      name: string;
      activityLevel: string;
      mood: string;
      notes: string;
      skills: string[];
    }>;
    nextLessonDate?: string;
  }): Promise<string> {
    const studentsInfo = data.students.length > 0
      ? data.students
        .map((s) => `- ${s.name}: активность ${this.getActivityText(s.activityLevel)}, настроение ${this.getMoodText(s.mood)}. ${s.notes || ''}`)
        .join('\n')
      : 'Информация о детях ещё не заполнена';

    // Use lessonDescription if provided (from metodichka), otherwise use topic
    const whatWasLearned = data.lessonDescription || data.lessonTopic;

    const prompt = `Создай сообщение для родителей о прошедшем уроке.

ДАННЫЕ:
- Преподаватель: ${data.teacherName}
- Группа: ${data.className}
- Тема урока: ${data.lessonTopic}
- Следующее занятие: ${data.nextLessonDate || 'уточняется'}

ЧТО ПРОХОДИЛИ НА УРОКЕ (из методички):
${whatWasLearned}

ИНФОРМАЦИЯ О ДЕТЯХ:
${studentsInfo}

ТРЕБОВАНИЯ К СООБЩЕНИЮ:
1. Начни с приветствия "Добрый день, уважаемые родители! На связи ${data.teacherName}!" с эмоджи 🏫
2. Напиши "На сегодняшнем уроке ребята:" и перечисли что они делали, каждый пункт начинай с ✅
3. Добавь блок про пользу урока с эмоджи ✨
4. Укажи дату следующего занятия с эмоджи 🔔
5. Добавь напоминание для отсутствовавших (прийти за 30 минут до начала) с эмоджи ❗️
6. Закончи: "❔Если возникнут вопросы, обязательно пишите. С уважением, ${data.teacherName}, преподаватель международной школы программирования 'Алгоритмика' 🖥"

ВАЖНО: Форматируй как пример выше. Пиши в прошедшем времени. Сохрани структуру с эмоджи.`;

    const systemPrompt = 'Ты - помощник преподавателя программирования для детей школы "Алгоритмика". Создаёшь сообщения для родителей о прогрессе их детей. Точно следуй формату из требований.';

    const response = await this.generate({ prompt, systemPrompt });
    return response.text;
  }

  /**
   * Generate personal OS (feedback) for a student
   */
  async generatePersonalOS(data: {
    adminName: string;
    teacherName: string;
    studentName: string;
    parentName: string;
    parentType: string;
    moduleName: string;
    lessonsData: Array<{
      lessonNumber: number;
      topic: string;
      description?: string;
      percentCompletion: number;
      wasPresent: boolean;
    }>;
    avgCompletion: number;
    totalLessons: number;
    attendedLessons: number;
    customTemplate?: string;
  }): Promise<string> {
    const styleHint = this.getStyleHintForParentType(data.parentType);
    
    // Формируем информацию по урокам
    const lessonsInfo = data.lessonsData.map((lesson, idx) => {
      const ordinal = this.getOrdinal(lesson.lessonNumber);
      if (!lesson.wasPresent) {
        return `— На ${ordinal} уроке ${data.studentName} отсутствовал - тема занятия: ${lesson.topic}`;
      }
      const desc = lesson.description || lesson.topic;
      return `— На ${ordinal} уроке ${data.studentName} ${desc}. ${lesson.percentCompletion}% выполнения практических заданий`;
    }).join('\n\n');

    // Определяем рекомендации на основе результатов
    let recommendationHint = '';
    const lowLessons = data.lessonsData.filter(l => l.wasPresent && l.percentCompletion < 80);
    const missedLessons = data.lessonsData.filter(l => !l.wasPresent);
    
    if (data.avgCompletion >= 95) {
      recommendationHint = 'Ребёнок показывает отличные результаты (95%+). Рекомендация: перевод на более сложный трек обучения для поддержания мотивации.';
    } else if (data.avgCompletion >= 80) {
      recommendationHint = 'Хорошие результаты (80-95%). Рекомендация: продолжать в том же духе, можно доработать отдельные темы.';
    } else if (lowLessons.length > 0) {
      const lowTopics = lowLessons.map(l => `урок ${l.lessonNumber} "${l.topic}" (${l.percentCompletion}%)`).join(', ');
      recommendationHint = `Есть пробелы по: ${lowTopics}. Рекомендация: повторить теорию и доделать практику по этим урокам.`;
    }
    
    if (missedLessons.length > 0) {
      recommendationHint += ` Пропущены уроки: ${missedLessons.map(l => l.lessonNumber).join(', ')}. Рекомендация: пройти отработку.`;
    }

    // Пример формата (можно заменить на customTemplate)
    const exampleFormat = data.customTemplate || `${data.parentName}, доброе утро, на связи ${data.adminName} ☀

Делюсь обратной связью после ${data.totalLessons} занятий по модулю «${data.moduleName}» от педагога ${data.teacherName} 💻

Средний процент выполнения заданий ${data.studentName} на образовательной платформе за ${data.attendedLessons} занятия — ${data.avgCompletion}%

[ИНФОРМАЦИЯ ПО УРОКАМ]

Образовательный результат: [АНАЛИЗ РЕЗУЛЬТАТОВ]

Рекомендации: [РЕКОМЕНДАЦИИ]

Желаем ${data.studentName} успехов в дальнейшем обучении и всегда рады вашей обратной связи 🤝🏻`;

    const prompt = `Создай персональную обратную связь для родителя по итогам модуля обучения.

ДАННЫЕ:
- Менеджер/Админ: ${data.adminName}
- Педагог: ${data.teacherName}
- Ребёнок: ${data.studentName}
- Имя родителя: ${data.parentName}
- Модуль: «${data.moduleName}»
- Средний процент выполнения: ${data.avgCompletion}%
- Всего занятий: ${data.totalLessons}
- Посещено занятий: ${data.attendedLessons}

ИНФОРМАЦИЯ ПО КАЖДОМУ УРОКУ:
${lessonsInfo}

${styleHint}

РЕКОМЕНДАЦИИ ДЛЯ ВКЛЮЧЕНИЯ:
${recommendationHint}

ПРИМЕР ФОРМАТА СООБЩЕНИЯ:
${exampleFormat}

ТРЕБОВАНИЯ:
1. Начни с приветствия: "[Имя родителя], доброе утро/день, на связи [Админ] ☀"
2. Вводная фраза о модуле и педагоге с эмоджи 💻
3. Средний процент выполнения
4. По каждому уроку отдельным пунктом (с "—"):
   - Что изучал/делал на уроке
   - Процент выполнения практических заданий
   - Если пропустил - указать "отсутствовал" и тему урока
5. "Образовательный результат:" - анализ успеваемости (активность, пробелы, сильные стороны)
6. "Рекомендации:" - конкретные рекомендации по улучшению или о переводе на сложный трек
7. Завершение: "Желаем [Имя ребёнка] успехов в дальнейшем обучении и всегда рады вашей обратной связи 🤝🏻"

ВАЖНО: Используй реальные данные из информации по урокам. Пиши конкретно и персонализированно.`;

    const systemPrompt = 'Ты - менеджер школы программирования "Алгоритмика". Создаёшь персональную обратную связь для родителей по итогам модуля обучения. Пиши в дружелюбном, но профессиональном тоне. Используй только предоставленные данные.';

    const response = await this.generate({ prompt, systemPrompt });
    return response.text;
  }

  /**
   * Get ordinal word for lesson number
   */
  private getOrdinal(num: number): string {
    const ordinals: Record<number, string> = {
      1: 'первом',
      2: 'втором', 
      3: 'третьем',
      4: 'четвёртом',
      5: 'пятом',
      6: 'шестом',
      7: 'седьмом',
      8: 'восьмом',
    };
    return ordinals[num] || `${num}-м`;
  }

  // ==================== Utility Methods ====================

  private getActivityText(level: string): string {
    const map: Record<string, string> = {
      LOW: 'низкая',
      MEDIUM: 'средняя',
      HIGH: 'высокая',
      VERY_HIGH: 'очень высокая',
    };
    return map[level] || level.toLowerCase();
  }

  private getMoodText(mood: string): string {
    const map: Record<string, string> = {
      HAPPY: 'радостное',
      INTERESTED: 'заинтересованное',
      NEUTRAL: 'нейтральное',
      TIRED: 'усталое',
      DISTRACTED: 'рассеянное',
    };
    return map[mood] || mood.toLowerCase();
  }

  private getStyleHintForParentType(parentType: string): string {
    switch (parentType) {
      case 'CALM':
        return 'СТИЛЬ: Спокойный, информативный. Фокус на достижениях и позитиве.';
      case 'ANXIOUS':
        return 'СТИЛЬ: Успокаивающий, поддерживающий. Подчеркни что всё под контролем, предложи помощь при необходимости.';
      case 'DEMANDING':
        return 'СТИЛЬ: Детальный, с конкретными цифрами и планом действий. Добавь статистику и конкретные шаги для улучшения.';
      default:
        return 'СТИЛЬ: Дружелюбный и информативный.';
    }
  }
}
