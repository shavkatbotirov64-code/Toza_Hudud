import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DispatchController } from './dispatch.controller';
import { DispatchService } from './dispatch.service';
import { Bin } from '../sensors/entities/bin.entity';
import { Dispatch } from './entities/dispatch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bin, Dispatch])],
  controllers: [DispatchController],
  providers: [DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
