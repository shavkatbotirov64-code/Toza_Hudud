import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthCheckService } from './services/health-check.service';
import { HealthController } from './controllers/health.controller';
import { Vehicle } from '../modules/vehicles/entities/vehicle.entity';
import { Bin } from '../modules/bins/entities/bin.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Vehicle, Bin])],
  providers: [HealthCheckService],
  controllers: [HealthController],
  exports: [HealthCheckService],
})
export class CommonModule {}
