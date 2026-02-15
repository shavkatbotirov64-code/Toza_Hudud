import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  vehicleId: string;

  @Column('simple-array')
  binIds: string[]; // Qaysi qutilar tozalanadi

  @Column('decimal', { precision: 10, scale: 6 })
  startLatitude: number;

  @Column('decimal', { precision: 10, scale: 6 })
  startLongitude: number;

  @Column('text')
  routePath: string; // JSON string: [[lat, lon], [lat, lon], ...]

  @Column('decimal', { precision: 10, scale: 2 })
  totalDistance: number; // km

  @Column('int')
  estimatedDuration: number; // daqiqa

  @Column({ default: 'pending' })
  status: string; // pending, in-progress, completed, cancelled

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
