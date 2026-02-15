import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('gps_locations')
@Index(['vehicleId', 'timestamp'])
export class GpsLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  vehicleId: string;

  @Column('decimal', { precision: 10, scale: 6 })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 6 })
  longitude: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  speed: number; // km/h

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  heading: number; // 0-360 daraja

  @Column('decimal', { precision: 6, scale: 2, nullable: true })
  altitude: number; // metr

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  accuracy: number; // metr

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Index()
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;
}
