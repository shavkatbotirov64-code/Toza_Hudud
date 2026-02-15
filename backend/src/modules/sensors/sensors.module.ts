import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SensorsController } from './sensors.controller';
import { SensorsService } from './sensors.service';
import { SensorsGateway } from './sensors.gateway';
import { SensorReading } from './entities/sensor-reading.entity';
import { SensorAlert } from './entities/sensor-alert.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SensorReading, SensorAlert])],
  controllers: [SensorsController],
  providers: [SensorsService, SensorsGateway],
  exports: [SensorsService, SensorsGateway],
})
export class SensorsModule {}