import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BinsService } from './bins.service';
import { BinsController } from './bins.controller';
import { Bin } from './entities/bin.entity';
import { BinHistory } from './entities/bin-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bin, BinHistory])],
  controllers: [BinsController],
  providers: [BinsService],
  exports: [BinsService],
})
export class BinsModule {}