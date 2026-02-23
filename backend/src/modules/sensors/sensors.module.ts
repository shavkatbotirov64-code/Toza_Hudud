import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SensorsController } from './sensors.controller';
import { SensorsService } from './sensors.service';
import { SensorsGateway } from './sensors.gateway';
import { DispatchService } from './dispatch.service';
import { BinsController } from './bins.controller';
import { BinsService } from './bins.service';
import { SensorReading } from './entities/sensor-reading.entity';
import { SensorAlert } from './entities/sensor-alert.entity';
import { Bin } from './entities/bin.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { Route } from '../routes/entities/route.entity';
import { RoutesModule } from '../routes/routes.module';
import { CleaningsModule } from '../cleanings/cleanings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SensorReading, SensorAlert, Bin, Vehicle, Route]),
    RoutesModule,
    CleaningsModule,
  ],
  controllers: [SensorsController, BinsController],
  providers: [SensorsService, SensorsGateway, BinsService, DispatchService],
  exports: [SensorsService, SensorsGateway, BinsService, DispatchService],
})
export class SensorsModule {}
