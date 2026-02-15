import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BinHistory } from './bin-history.entity';

export enum BinType {
  GENERAL = 'general',
  PLASTIC = 'plastic',
  ORGANIC = 'organic',
  PAPER = 'paper',
  GLASS = 'glass',
  METAL = 'metal',
}

export enum BinStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  DAMAGED = 'damaged',
}

@Entity('bins')
export class Bin {
  @ApiProperty({ example: 'uuid', description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'BIN-001', description: 'Bin code' })
  @Column({ unique: true, length: 50 })
  code: string;

  @ApiProperty({ example: 'Amir Temur ko\'chasi 123', description: 'Address' })
  @Column({ length: 500 })
  address: string;

  @ApiProperty({ example: 'yakkasaroy', description: 'District' })
  @Column({ length: 100 })
  district: string;

  @ApiProperty({ example: 41.284, description: 'Latitude' })
  @Column('decimal', { precision: 10, scale: 7 })
  latitude: number;

  @ApiProperty({ example: 69.279, description: 'Longitude' })
  @Column('decimal', { precision: 10, scale: 7 })
  longitude: number;

  @ApiProperty({ example: 120, description: 'Capacity in liters' })
  @Column('int')
  capacity: number;

  @ApiProperty({ example: 75.5, description: 'Current fill level percentage' })
  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  fillLevel: number;

  @ApiProperty({ enum: BinType, example: BinType.GENERAL })
  @Column({
    type: 'enum',
    enum: BinType,
    default: BinType.GENERAL,
  })
  type: BinType;

  @ApiProperty({ enum: BinStatus, example: BinStatus.ACTIVE })
  @Column({
    type: 'enum',
    enum: BinStatus,
    default: BinStatus.ACTIVE,
  })
  status: BinStatus;

  @ApiProperty({ example: 'SENSOR-001', description: 'Sensor identifier' })
  @Column({ length: 100, nullable: true })
  sensorId: string;

  @ApiProperty({ example: true, description: 'Is sensor online' })
  @Column({ default: true })
  isOnline: boolean;

  @ApiProperty({ example: '2024-01-01T10:30:00Z', description: 'Last update time' })
  @Column({ type: 'timestamp', nullable: true })
  lastUpdate: Date;

  @ApiProperty({ example: '2024-01-01T08:00:00Z', description: 'Last cleaned time' })
  @Column({ type: 'timestamp', nullable: true })
  lastCleaned: Date;

  @ApiProperty({ example: 85, description: 'Battery level percentage' })
  @Column('int', { default: 100 })
  batteryLevel: number;

  @ApiProperty({ example: 23.5, description: 'Temperature in Celsius' })
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  temperature: number;

  @ApiProperty({ example: 65.2, description: 'Humidity percentage' })
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  humidity: number;

  @ApiProperty({ description: 'Bin history records' })
  @OneToMany(() => BinHistory, (history) => history.bin)
  history: BinHistory[];

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  @UpdateDateColumn()
  updatedAt: Date;
}