import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DispatchController } from './dispatch.controller';
import { DispatchService } from './dispatch.service';
import { Bin } from '../sensors/entities/bin.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bin])],
  controllers: [DispatchController],
  providers: [DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
