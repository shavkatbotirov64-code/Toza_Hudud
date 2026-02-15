import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SensorsController } from './sensors.controller';
import { SensorsService } from './sensors.service';
import { SensorsGateway } from './sensors.gateway';
import { BinsController } from './bins.controller';
import { BinsService } from './bins.service';
import { SensorReading } from './entities/sensor-reading.entity';
import { SensorAlert } from './entities/sensor-alert.entity';
import { Bin } from './entities/bin.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SensorReading, SensorAlert, Bin])],
  controllers: [SensorsController, BinsController],
  providers: [SensorsService, SensorsGateway, BinsService],
  exports: [SensorsService, SensorsGateway, BinsService],
})
export class SensorsModule {}