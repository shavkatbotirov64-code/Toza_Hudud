import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { VehicleHistory } from './vehicle-history.entity';

export enum VehicleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MOVING = 'moving',
  MAINTENANCE = 'maintenance',
  OUT_OF_SERVICE = 'out_of_service',
}

export enum VehicleType {
  SMALL_TRUCK = 'small_truck',
  MEDIUM_TRUCK = 'medium_truck',
  LARGE_TRUCK = 'large_truck',
  COMPACTOR = 'compactor',
}

@Entity('vehicles')
export class Vehicle {
  @ApiProperty({ example: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'VH-001' })
  @Column({ unique: true, length: 50 })
  code: string;

  @ApiProperty({ example: '01A123AA' })
  @Column({ length: 20 })
  licensePlate: string;

  @ApiProperty({ example: 'Alisher Karimov' })
  @Column({ length: 200 })
  driverName: string;

  @ApiProperty({ example: '+998901234567' })
  @Column({ length: 20 })
  driverPhone: string;

  @ApiProperty({ enum: VehicleType })
  @Column({
    type: 'enum',
    enum: VehicleType,
    default: VehicleType.MEDIUM_TRUCK,
  })
  type: VehicleType;

  @ApiProperty({ enum: VehicleStatus })
  @Column({
    type: 'enum',
    enum: VehicleStatus,
    default: VehicleStatus.INACTIVE,
  })
  status: VehicleStatus;

  @ApiProperty({ example: 5000 })
  @Column('int')
  capacity: number;

  @ApiProperty({ example: 41.284 })
  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  currentLatitude: number;

  @ApiProperty({ example: 69.279 })
  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  currentLongitude: number;

  @ApiProperty({ example: 85.5 })
  @Column('decimal', { precision: 5, scale: 2, default: 100 })
  fuelLevel: number;

  @ApiProperty({ example: 45.2 })
  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  currentSpeed: number;

  @ApiProperty({ example: 1250.5 })
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalDistance: number;

  @ApiProperty({ example: 12 })
  @Column('int', { default: 0 })
  binsCollectedToday: number;

  @ApiProperty({ example: 'Route A' })
  @Column({ length: 100, nullable: true })
  currentRoute: string;

  @ApiProperty({ example: '2024-01-01T08:00:00Z' })
  @Column({ type: 'timestamp', nullable: true })
  lastServiceDate: Date;

  @ApiProperty({ example: '2024-01-01T10:30:00Z' })
  @Column({ type: 'timestamp', nullable: true })
  lastLocationUpdate: Date;

  @ApiProperty({ example: 'GPS-TRACKER-001' })
  @Column({ length: 100, nullable: true })
  gpsTrackerId: string;

  @ApiProperty({ example: true })
  @Column({ default: true })
  isGpsOnline: boolean;

  @OneToMany(() => VehicleHistory, (history) => history.vehicle)
  history: VehicleHistory[];

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  @UpdateDateColumn()
  updatedAt: Date;
}