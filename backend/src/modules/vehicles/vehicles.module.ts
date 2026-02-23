import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { GpsController } from './gps.controller';
import { GpsService } from './gps.service';
import { Vehicle } from './entities/vehicle.entity';
import { GpsLocation } from './entities/gps-location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle, GpsLocation])],
  controllers: [VehiclesController, GpsController],
  providers: [VehiclesService, GpsService],
  exports: [VehiclesService, GpsService],
})
export class VehiclesModule {}
