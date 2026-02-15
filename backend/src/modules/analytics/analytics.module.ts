import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Cleaning } from '../cleanings/entities/cleaning.entity';
import { Bin } from '../sensors/entities/bin.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { SensorReading } from '../sensors/entities/sensor-reading.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cleaning, Bin, Vehicle, SensorReading]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
