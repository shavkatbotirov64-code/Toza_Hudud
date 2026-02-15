import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { RouteBin } from './route-bin.entity';

export enum RouteStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum RoutePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('routes')
export class Route {
  @ApiProperty({ example: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Route A - Yakkasaroy' })
  @Column({ length: 200 })
  name: string;

  @ApiProperty({ example: 'Daily collection route for Yakkasaroy district' })
  @Column({ length: 500, nullable: true })
  description: string;

  @ApiProperty({ example: 'uuid' })
  @Column('uuid', { nullable: true })
  assignedVehicleId: string;

  @ApiProperty({ enum: RouteStatus })
  @Column({
    type: 'enum',
    enum: RouteStatus,
    default: RouteStatus.PLANNED,
  })
  status: RouteStatus;

  @ApiProperty({ enum: RoutePriority })
  @Column({
    type: 'enum',
    enum: RoutePriority,
    default: RoutePriority.MEDIUM,
  })
  priority: RoutePriority;

  @ApiProperty({ example: 15.5 })
  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  totalDistance: number;

  @ApiProperty({ example: 120 })
  @Column('int', { nullable: true })
  estimatedDuration: number; // in minutes

  @ApiProperty({ example: 85.5 })
  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  completionPercentage: number;

  @ApiProperty({ example: '2024-01-01T08:00:00Z' })
  @Column({ type: 'timestamp', nullable: true })
  scheduledStartTime: Date;

  @ApiProperty({ example: '2024-01-01T08:15:00Z' })
  @Column({ type: 'timestamp', nullable: true })
  actualStartTime: Date;

  @ApiProperty({ example: '2024-01-01T10:30:00Z' })
  @Column({ type: 'timestamp', nullable: true })
  actualEndTime: Date;

  @ApiProperty({ example: 8 })
  @Column('int', { default: 0 })
  totalBins: number;

  @ApiProperty({ example: 6 })
  @Column('int', { default: 0 })
  completedBins: number;

  @ApiProperty({ example: { startPoint: { lat: 41.284, lng: 69.279 } } })
  @Column('jsonb', { nullable: true })
  routeData: any;

  @OneToMany(() => RouteBin, (routeBin) => routeBin.route)
  routeBins: RouteBin[];

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  @UpdateDateColumn()
  updatedAt: Date;
}