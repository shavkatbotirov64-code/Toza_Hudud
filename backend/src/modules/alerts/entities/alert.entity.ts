import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum AlertType {
  BIN_FULL = 'bin_full',
  BIN_OVERFLOW = 'bin_overflow',
  SENSOR_OFFLINE = 'sensor_offline',
  VEHICLE_BREAKDOWN = 'vehicle_breakdown',
  ROUTE_DELAY = 'route_delay',
  BATTERY_LOW = 'battery_low',
  TEMPERATURE_HIGH = 'temperature_high',
  MAINTENANCE_DUE = 'maintenance_due',
  FUEL_LOW = 'fuel_low',
  GPS_OFFLINE = 'gps_offline',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

@Entity('alerts')
export class Alert {
  @ApiProperty({ example: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ enum: AlertType })
  @Column({
    type: 'enum',
    enum: AlertType,
  })
  type: AlertType;

  @ApiProperty({ enum: AlertSeverity })
  @Column({
    type: 'enum',
    enum: AlertSeverity,
    default: AlertSeverity.MEDIUM,
  })
  severity: AlertSeverity;

  @ApiProperty({ enum: AlertStatus })
  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.ACTIVE,
  })
  status: AlertStatus;

  @ApiProperty({ example: 'Bin BIN-001 is full' })
  @Column({ length: 200 })
  title: string;

  @ApiProperty({ example: 'Bin BIN-001 at Amir Temur street has reached 95% capacity' })
  @Column({ length: 1000 })
  message: string;

  @ApiProperty({ example: 'uuid' })
  @Column('uuid', { nullable: true })
  binId: string;

  @ApiProperty({ example: 'uuid' })
  @Column('uuid', { nullable: true })
  vehicleId: string;

  @ApiProperty({ example: 'uuid' })
  @Column('uuid', { nullable: true })
  routeId: string;

  @ApiProperty({ example: { fillLevel: 95, threshold: 90 } })
  @Column('jsonb', { nullable: true })
  metadata: any;

  @ApiProperty({ example: 'Amir Temur street, Yakkasaroy' })
  @Column({ length: 500, nullable: true })
  location: string;

  @ApiProperty({ example: 41.284 })
  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  latitude: number;

  @ApiProperty({ example: 69.279 })
  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  longitude: number;

  @ApiProperty({ example: 'user-uuid' })
  @Column('uuid', { nullable: true })
  acknowledgedBy: string | null;

  @ApiProperty({ example: '2024-01-01T10:30:00Z' })
  @Column({ type: 'timestamp', nullable: true })
  acknowledgedAt: Date;

  @ApiProperty({ example: 'user-uuid' })
  @Column('uuid', { nullable: true })
  resolvedBy: string | null;

  @ApiProperty({ example: '2024-01-01T11:00:00Z' })
  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @ApiProperty({ example: 'Bin was emptied by vehicle VH-001' })
  @Column({ length: 500, nullable: true })
  resolutionNotes: string;

  @ApiProperty({ example: true })
  @Column({ default: false })
  isRead: boolean;

  @ApiProperty({ example: true })
  @Column({ default: true })
  notificationSent: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  @UpdateDateColumn()
  updatedAt: Date;
}