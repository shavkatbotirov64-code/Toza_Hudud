import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ESP32Controller } from './esp32.controller';
import { BinsModule } from './modules/bins/bins.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { SensorsModule } from './modules/sensors/sensors.module';
import { CleaningsModule } from './modules/cleanings/cleanings.module';
import { RoutesModule } from './modules/routes/routes.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { RoutingModule } from './modules/routing/routing.module';
import { CommonModule } from './common/common.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { getDatabaseConfig } from './config/database.config';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    CommonModule, // ✨ YANGI: Global error handling va health check
    BinsModule,
    VehiclesModule,
    AlertsModule,
    TelegramModule,
    SensorsModule,
    CleaningsModule,
    RoutesModule,
    NotificationsModule,
    AnalyticsModule,
    ActivitiesModule,
    RoutingModule,
  ],
  controllers: [AppController, ESP32Controller],
  providers: [
    AppService,
    // ✨ YANGI: Global exception filter
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // ✨ YANGI: Global logging interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
