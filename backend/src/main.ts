import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter, AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // CORS configuration - Allow all origins in production (nginx proxy handles it)
  const allowedOrigins = [
    'http://localhost:80', 
    'http://localhost:8080', 
    'http://localhost:5173',
  ];
  
  // Add production frontend URL from environment
  const frontendUrl = configService.get('FRONTEND_URL');
  if (frontendUrl) {
    allowedOrigins.push(frontendUrl);
  }

  // CORS configuration - Allow all origins for sensors endpoint
  app.enableCors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // NO GLOBAL PREFIX - all endpoints work directly
  // app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filters
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Smart Trash System API')
    .setDescription('API documentation for Smart Trash Management System')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'User authentication endpoints')
    .addTag('Bins', 'Trash bin management endpoints')
    .addTag('Vehicles', 'Vehicle tracking endpoints')
    .addTag('Routes', 'Route optimization endpoints')
    .addTag('Alerts', 'Alert management endpoints')
    .addTag('Analytics', 'Analytics and reporting endpoints')
    .addTag('Telegram', 'Telegram bot integration endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get('port');
  await app.listen(port);

  console.log(`🚀 Smart Trash System API is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
