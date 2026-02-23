import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CleaningsController } from './cleanings.controller';
import { CleaningsService } from './cleanings.service';
import { Cleaning } from './entities/cleaning.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cleaning])],
  controllers: [CleaningsController],
  providers: [CleaningsService],
  exports: [CleaningsService],
})
export class CleaningsModule {}
