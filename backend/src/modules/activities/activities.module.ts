import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { Activity } from './entities/activity.entity';

@Global() // Global module - barcha joyda ishlatish mumkin
@Module({
  imports: [TypeOrmModule.forFeature([Activity])],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService], // Boshqa modullar ishlatishi uchun
})
export class ActivitiesModule {}
