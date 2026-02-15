import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Bin } from './bin.entity';

export enum HistoryAction {
  FILL_LEVEL_UPDATE = 'fill_level_update',
  CLEANED = 'cleaned',
  MAINTENANCE = 'maintenance',
  STATUS_CHANGE = 'status_change',
  SENSOR_OFFLINE = 'sensor_offline',
  SENSOR_ONLINE = 'sensor_online',
  BATTERY_LOW = 'battery_low',
  TEMPERATURE_ALERT = 'temperature_alert',
}

@Entity('bin_history')
export class BinHistory {
  @ApiProperty({ example: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'uuid' })
  @Column('uuid')
  binId: string;

  @ApiProperty({ enum: HistoryAction })
  @Column({
    type: 'enum',
    enum: HistoryAction,
  })
  action: HistoryAction;

  @ApiProperty({ example: 'Fill level changed from 70% to 85%' })
  @Column({ length: 500 })
  description: string;

  @ApiProperty({ example: { oldValue: 70, newValue: 85 } })
  @Column('jsonb', { nullable: true })
  metadata: any;

  @ApiProperty({ example: 'user-uuid or system' })
  @Column({ length: 100, nullable: true })
  performedBy: string;

  @ManyToOne(() => Bin, (bin) => bin.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'binId' })
  bin: Bin;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  @CreateDateColumn()
  createdAt: Date;
}