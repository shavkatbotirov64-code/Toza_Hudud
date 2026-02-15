import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
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
    BinsModule,
    VehiclesModule,
    AlertsModule,
    TelegramModule,
    SensorsModule,
    CleaningsModule,
    RoutesModule,
  ],
  controllers: [AppController, ESP32Controller],
  providers: [AppService],
})
export class AppModule {}
