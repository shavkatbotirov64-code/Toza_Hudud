import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('sensor_readings')
export class SensorReading {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  distance: number;

  @Column({ nullable: true })
  binId: string;

  @Column({ nullable: true })
  location: string;

  @Column({ default: false })
  isAlert: boolean;

  @CreateDateColumn()
  timestamp: Date;
}
