import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Route } from './route.entity';
import { Bin } from '../../bins/entities/bin.entity';

export enum RouteBinStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
}

@Entity('route_bins')
export class RouteBin {
  @ApiProperty({ example: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'uuid' })
  @Column('uuid')
  routeId: string;

  @ApiProperty({ example: 'uuid' })
  @Column('uuid')
  binId: string;

  @ApiProperty({ example: 1 })
  @Column('int')
  sequenceOrder: number;

  @ApiProperty({ enum: RouteBinStatus })
  @Column({
    type: 'enum',
    enum: RouteBinStatus,
    default: RouteBinStatus.PENDING,
  })
  status: RouteBinStatus;

  @ApiProperty({ example: 5.2 })
  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  distanceFromPrevious: number;

  @ApiProperty({ example: 15 })
  @Column('int', { nullable: true })
  estimatedTimeMinutes: number;

  @ApiProperty({ example: '2024-01-01T08:30:00Z' })
  @Column({ type: 'timestamp', nullable: true })
  actualArrivalTime: Date;

  @ApiProperty({ example: '2024-01-01T08:45:00Z' })
  @Column({ type: 'timestamp', nullable: true })
  actualCompletionTime: Date;

  @ApiProperty({ example: 'Bin was full and collected successfully' })
  @Column({ length: 500, nullable: true })
  notes: string;

  @ManyToOne(() => Route, (route) => route.routeBins, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'routeId' })
  route: Route;

  @ManyToOne(() => Bin, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'binId' })
  bin: Bin;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  @CreateDateColumn()
  createdAt: Date;
}