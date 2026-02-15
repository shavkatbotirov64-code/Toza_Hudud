import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Vehicle } from './vehicle.entity';

export enum VehicleHistoryAction {
  LOCATION_UPDATE = 'location_update',
  STATUS_CHANGE = 'status_change',
  BIN_COLLECTED = 'bin_collected',
  ROUTE_STARTED = 'route_started',
  ROUTE_COMPLETED = 'route_completed',
  FUEL_REFILL = 'fuel_refill',
  MAINTENANCE_START = 'maintenance_start',
  MAINTENANCE_END = 'maintenance_end',
  GPS_OFFLINE = 'gps_offline',
  GPS_ONLINE = 'gps_online',
}

@Entity('vehicle_history')
export class VehicleHistory {
  @ApiProperty({ example: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'uuid' })
  @Column('uuid')
  vehicleId: string;

  @ApiProperty({ enum: VehicleHistoryAction })
  @Column({
    type: 'enum',
    enum: VehicleHistoryAction,
  })
  action: VehicleHistoryAction;

  @ApiProperty({ example: 'Vehicle moved to new location' })
  @Column({ length: 500 })
  description: string;

  @ApiProperty({ example: { latitude: 41.284, longitude: 69.279, speed: 45 } })
  @Column('jsonb', { nullable: true })
  metadata: any;

  @ApiProperty({ example: 'system or user-uuid' })
  @Column({ length: 100, nullable: true })
  performedBy: string;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  @CreateDateColumn()
  createdAt: Date;
}