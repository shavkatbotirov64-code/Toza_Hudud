import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CleaningsController } from './cleanings.controller';
import { CleaningsService } from './cleanings.service';
import { Cleaning } from './entities/cleaning.entity';
import { SensorsModule } from '../sensors/sensors.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cleaning]),
    SensorsModule,
    ActivitiesModule,
  ],
  controllers: [CleaningsController],
  providers: [CleaningsService],
  exports: [CleaningsService],
})
export class CleaningsModule {}
