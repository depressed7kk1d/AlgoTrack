import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS (строгая настройка)
  const allowedOrigins = [
    'https://algoschool.org',
    'http://algoschool.org',
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:5173');
    allowedOrigins.push('http://localhost:3000');
  }

  app.enableCors({
    origin: (origin, callback) => {
      // В production не разрешаем запросы без origin (кроме health check)
      if (!origin) {
        if (process.env.NODE_ENV === 'development') {
          return callback(null, true);
        }
        // В production блокируем запросы без origin
        return callback(new Error('Запрещено CORS политикой'));
      }
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`❌ CORS заблокировал запрос с origin: ${origin}`);
        }
        callback(new Error('Запрещено CORS политикой'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe (строгая валидация)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Удаляет поля которых нет в DTO
      forbidNonWhitelisted: true, // Выдаёт ошибку при лишних полях
      transform: true,            // Автопреобразование типов
      transformOptions: {
        enableImplicitConversion: true,
      },
      // Детальные сообщения об ошибках
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => ({
          field: error.property,
          errors: Object.values(error.constraints || {}),
        }));
        return new Error(JSON.stringify(messages));
      },
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation (только для development)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('AlgoTrack API')
      .setDescription('API для платформы автоматизации отчетов Алгоритмика')
      .setVersion('2.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    console.log('📚 Swagger доступен на /api (только dev)');
  } else {
    console.log('🔒 Swagger отключен в production');
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`📚 API docs available at http://localhost:${port}/api`);
}

bootstrap();



