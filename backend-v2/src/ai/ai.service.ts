import { Injectable, HttpException, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import axios, { AxiosRequestConfig } from 'axios';
import * as https from 'https';
import { AI_PROVIDER_PRESETS } from './ai.providers';
import { parseEncryptedAiCredentials, AiCredentialsMap } from '../schools/ai-credentials.helper';

interface AiProviderConfig {
  name: string;
  displayName: string;
  apiUrl: string;
  authType: string;
  authConfig: any;
  requestFormat: any;
  responseMapping: any;
  modelConfig: any;
}

interface ParsedCredentials {
  raw: string | null;
  data: Record<string, any>;
}

@Injectable()
export class AiService implements OnModuleInit {
  private tokenCache: Map<string, { token: string; expiresAt: number }> = new Map();
  private readonly logger = new Logger(AiService.name);

  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
  ) {}

  async onModuleInit() {
    await this.syncProviderConfigs();
  }

  private async syncProviderConfigs() {
    await Promise.all(
      AI_PROVIDER_PRESETS.map((preset) =>
        this.prisma.aiProviderConfig.upsert({
          where: { name: preset.name },
          update: {
            displayName: preset.displayName,
            apiUrl: preset.apiUrl,
            authType: preset.authType,
            authConfig: preset.authConfig,
            requestFormat: preset.requestFormat,
            responseMapping: preset.responseMapping,
            modelConfig: preset.modelConfig,
            isActive: true,
          },
          create: {
            name: preset.name,
            displayName: preset.displayName,
            apiUrl: preset.apiUrl,
            authType: preset.authType,
            authConfig: preset.authConfig,
            requestFormat: preset.requestFormat,
            responseMapping: preset.responseMapping,
            modelConfig: preset.modelConfig,
            isActive: true,
          },
        })
      ),
    ).catch((error) => {
      this.logger.error('Не удалось синхронизировать AI провайдеры', error as Error);
    });
  }

  /**
   * Генерация ОС после урока
   */
  async generateLessonSummary(
    schoolId: string,
    data: {
      teacherName: string;
      lessonTopic: string;
      nextLessonDate?: string;
    }
  ): Promise<string> {
    const prompt = `Ты — учитель, готовишь обратную связь для родителей после урока программирования.

Исходный текст урока (что проходили):
${data.lessonTopic}

Требования:
1. Создай список из 3-7 пунктов пройденного материала
2. Используй формат: '✅ [описание]' для каждого пункта
3. Все в прошедшем времени (урок уже прошёл)
4. Понятно для родителей (не программистов)
5. Конкретно и по делу, без лишней воды
6. Используй простой язык, избегай технических терминов где возможно

Примеры хороших пунктов:
- ✅ Узнали, что такое пиксель и как из пикселей формируются изображения.
- ✅ Научились создавать пиксельные буквы и цифры в редакторе.
- ✅ Используя черепашку, написали свои имена и построили буквы.

Верни ТОЛЬКО список пунктов в формате ✅, без дополнительного текста.`;

    const bulletPoints = await this.callAi(schoolId, prompt);

    // Формируем финальное сообщение согласно примеру пользователя
    const nextLessonDateFormatted = data.nextLessonDate 
      ? new Date(data.nextLessonDate).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : null;

    const message = `Добрый день, уважаемые родители! На связи ${data.teacherName}!

🏫 На сегодняшнем уроке ребята:

${bulletPoints}

✨ Этот урок был особенно полезен, так как помог ребятам развить алгоритмическое мышление, научил работать по шагам и видеть, как команды превращаются в реальные объекты. Кроме того, через игру в Minecraft дети закрепили навыки программирования и тренировали внимание и усидчивость.

${nextLessonDateFormatted ? `🔔 Следующее занятие: ${nextLessonDateFormatted}` : ''}

❗Ученики, которые не смогли прийти на урок, должны быть на следующем уроке за 30 минут до начала!

❔Если возникнут вопросы, обязательно пишите. Чат с преподавателем всегда открыт.

С уважением, ${data.teacherName}, преподаватель международной школы программирования 'Алгоритмика' 🖥`;

    return message;
  }

  /**
   * Генерация персональной ОС по 4 урокам (для админа, отправляется в ЛС родителю)
   */
  async generatePersonalReport(
    schoolId: string,
    data: {
      parentName: string;
      studentName: string;
      managerName: string;
      moduleName: string;
      lessons: Array<{
        number: number;
        topic: string;
        percent: number;
      }>;
      absences?: number[];
    }
  ): Promise<string> {
    const avgPercent = data.lessons.reduce((sum, l) => sum + l.percent, 0) / data.lessons.length;
    const hasAbsences = data.absences && data.absences.length > 0;

    // Формируем описание уроков
    const lessonsDescription = data.lessons.map((lesson, index) => {
      const lessonNum = index + 1;
      return `Урок ${lessonNum}: ${lesson.topic} (${lesson.percent}% выполнения)`;
    }).join('\n');

    const prompt = `Ты — учитель, готовишь персональную обратную связь для родителей по прогрессу их ребёнка. Тебе предоставляют:

1. Имя родителя: ${data.parentName}
2. Имя ребёнка: ${data.studentName}
3. Модуль: ${data.moduleName}
4. Список уроков:
${lessonsDescription}
5. Процент выполненных заданий по каждому уроку (указан в скобках)
${hasAbsences ? `6. Информация об отсутствиях: ученик отсутствовал на уроках ${data.absences.join(', ')}` : ''}

Требования к письму:

1. В приветствии используй имя родителя, а в тексте имя ребёнка.
2. Начни: "${data.parentName}, добрый день! На связи ${data.managerName} ☀️"
3. Кратко расскажи, чему ребёнок научился на каждом уроке (беря описание из предоставленных данных).
4. В конце письма добавь *Образовательный результат*, включая:
   - средний процент выполнения (${avgPercent.toFixed(0)}%),
   - рекомендации по повторению материала, если % ниже 80%,
   - упоминание отработки 30 минут на следующем уроке, если ребёнок отсутствовал,
   - информацию о переводе на более сложный трек, если % выполнения выше 90%.
5. Тон письма: дружелюбный, поддерживающий, легко читаемый.
6. Оформляй письмо как текст, а не как таблицу или сухой список.

Пример начала письма:
"[Имя родителя], добрый день! На связи Оксана ☀️
Делюсь обратной связью после последних занятий по модулю «[Название модуля]» 🤝🏻
— На первом уроке [Имя ребёнка] [краткое описание изученного материала]..."

Генерируй полный текст для одного ребёнка в таком стиле.`;

    return await this.callAi(schoolId, prompt);
  }

  /**
   * Универсальный вызов AI провайдера
   */
  private async callAi(schoolId: string, prompt: string): Promise<string> {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });

    if (!school) {
      throw new HttpException('Школа не найдена', 404);
    }

    if (!school.aiProvider) {
      throw new HttpException('AI провайдер не настроен', 400);
    }

    const providerConfig = await this.prisma.aiProviderConfig.findUnique({
      where: { name: school.aiProvider },
    });

    if (!providerConfig || !providerConfig.isActive) {
      throw new HttpException('AI провайдер не найден или отключён', 400);
    }

    const { map: credentialMap, fallback } = parseEncryptedAiCredentials(this.crypto, school.aiApiKey);
    const providerCredentials = credentialMap[school.aiProvider] || null;

    if (!providerCredentials && !fallback) {
      throw new HttpException('Для выбранного провайдера не настроен API ключ', 400);
    }

    const tokenSource = this.resolveTokenSource(providerConfig.name, providerCredentials, fallback);
    let authToken: string | null = null;

    if (providerConfig.authType === 'oauth') {
      if (!tokenSource) {
        throw new HttpException('OAuth ключ не настроен для школы', 400);
      }
      authToken = await this.getOAuthToken(providerConfig, tokenSource, school.id);
    } else {
      authToken = tokenSource;
    }

    if (!authToken) {
      throw new HttpException('API ключ не настроен для школы', 400);
    }

    this.validateProviderRequirements(providerConfig.name, providerCredentials);

    try {
      return await this.makeAiRequest(providerConfig, {
        prompt,
        accessToken: authToken,
        providerCredentials: providerCredentials || {},
      });
    } catch (error) {
      this.logger.error('Ошибка вызова AI', error as Error);
      throw new HttpException('Ошибка генерации через AI', 500);
    }
  }

  /**
   * Получение OAuth токена (для GigaChat)
   */
  private async getOAuthToken(config: AiProviderConfig, authKey: string, schoolId: string): Promise<string> {
    const cacheKey = `oauth:${config.name}:${schoolId}`;
    const cached = this.tokenCache.get(cacheKey);

    // Проверяем кеш
    if (cached && Date.now() < cached.expiresAt) {
      return cached.token;
    }

    // Получаем новый токен
    try {
      const tokenUrl = config.authConfig.tokenUrl;
      const scope = config.authConfig.scope || 'GIGACHAT_API_PERS';
      if (!authKey) {
        throw new HttpException('OAuth ключ не настроен для школы', 400);
      }

      const payload = new URLSearchParams();
      payload.append('scope', scope);

      const response = await axios.post(
        tokenUrl,
        payload.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${authKey}`,
            'RqUID': this.generateUUID(),
          },
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        }
      );

      const token = response.data.access_token;
      
      // Кешируем на 25 минут
      this.tokenCache.set(cacheKey, {
        token,
        expiresAt: Date.now() + 25 * 60 * 1000,
      });

      return token;
    } catch (error) {
      this.logger.error('Ошибка получения OAuth токена', error as Error);
      throw error;
    }
  }

  /**
   * Выполнение запроса к AI провайдеру
   */
  private async makeAiRequest(
    config: AiProviderConfig,
    context: { prompt: string; accessToken: string; providerCredentials?: Record<string, any> },
  ): Promise<string> {
    const providerVars = context.providerCredentials || {};
    const templateVars: Record<string, any> = {
      model: providerVars.model || config.modelConfig?.model,
      prompt: context.prompt,
      temperature: providerVars.temperature ?? config.modelConfig?.temperature ?? 0.7,
      maxTokens: providerVars.maxTokens ?? config.modelConfig?.maxTokens ?? 2000,
      token: context.accessToken,
      apiKey: context.accessToken,
      ...providerVars,
    };

    const bodyTemplate = config.requestFormat?.bodyTemplate;
    const headers = this.replaceHeaders(config.requestFormat?.headers || {}, templateVars);
    const method = (config.requestFormat?.method || 'POST').toUpperCase();
    const bodyPayload = bodyTemplate ? JSON.parse(this.replaceTemplate(bodyTemplate, templateVars)) : undefined;

    const requestConfig: AxiosRequestConfig = {
      method,
      url: config.apiUrl,
      headers,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 30000,
    };

    if (method === 'GET') {
      requestConfig.params = bodyPayload;
    } else if (bodyPayload !== undefined) {
      requestConfig.data = bodyPayload;
    }

    const response = await axios(requestConfig);
    return this.extractResponse(response.data, config.responseMapping.contentPath);
  }

  /**
   * Замена плейсхолдеров в шаблоне
   */
  private replaceTemplate(template: string, vars: Record<string, any>): string {
    if (!template) {
      return template;
    }

    return template.replace(/\{\{\s*([\w.\[\]]+)\s*\}\}/g, (_, key) => {
      const value = this.resolveTemplateValue(vars, key);

      if (value === undefined || value === null) {
        return '';
      }

      if (typeof value === 'string') {
        return this.escapeJson(value);
      }

      if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      }

      return JSON.stringify(value);
    });
  }

  private resolveTemplateValue(vars: Record<string, any>, path: string): any {
    return path.split('.').reduce((acc: any, part) => {
      if (acc === undefined || acc === null) {
        return undefined;
      }
      if (part.includes('[')) {
        const [key, indexPart] = part.replace(']', '').split('[');
        const idx = Number(indexPart);
        const next = acc[key];
        return Array.isArray(next) ? next[idx] : undefined;
      }
      return acc[part];
    }, vars);
  }

  /**
   * Замена плейсхолдеров в заголовках
   */
  private replaceHeaders(headersTemplate: Record<string, string>, vars: Record<string, any>): Record<string, string> {
    const headers: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(headersTemplate)) {
      headers[key] = this.replaceTemplate(value, vars);
    }
    
    return headers;
  }

  /**
   * Извлечение ответа по пути (например "choices[0].message.content")
   */
  private extractResponse(data: any, path: string): string {
    const parts = path.split('.');
    let result = data;

    for (const part of parts) {
      if (result === undefined || result === null) {
        break;
      }

      const arrayMatch = part.match(/(\w+)\[(\d+)\]/);
      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        const container = result[key];
        result = Array.isArray(container) ? container[parseInt(index, 10)] : undefined;
      } else {
        result = result[part];
      }
    }

    if (result === undefined || result === null) {
      throw new HttpException('AI провайдер вернул пустой ответ', 502);
    }

    return result;
  }

  /**
   * Генерация UUID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Экранирование строк для JSON
   */
  private escapeJson(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n')
      .replace(/\t/g, '\\t');
  }

  /**
   * Приведение расшифрованного ключа к объекту
   */
  private parseCredentials(value: string | null): ParsedCredentials {
    if (!value) {
      return { raw: null, data: {} };
    }

    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') {
        return {
          raw: null,
          data: parsed,
        };
      }
    } catch (error) {
      // Игнорируем, используем строковое значение
    }

    return {
      raw: value,
      data: { apiKey: value },
    };
  }

  private hasCredentials(credentials: ParsedCredentials): boolean {
    return Boolean(credentials.raw) || Object.keys(credentials.data).length > 0;
  }

  private buildTemplateVariables(
    config: AiProviderConfig,
    prompt: string,
    token: string,
    credentials: ParsedCredentials,
  ): Record<string, any> {
    const baseVars: Record<string, any> = {
      model: config.modelConfig?.model,
      prompt,
      temperature: config.modelConfig?.temperature ?? 0.7,
      maxTokens: config.modelConfig?.maxTokens ?? 2000,
      token,
      apiKey: credentials.data.apiKey || credentials.raw || '',
      rawCredential: credentials.raw,
    };

    return {
      ...baseVars,
      ...credentials.data,
    };
  }
}

