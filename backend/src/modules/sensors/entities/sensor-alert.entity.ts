import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sensor_alerts')
export class SensorAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  distance: number;

  @Column({ nullable: true })
  binId: string;

  @Column({ nullable: true })
  location: string;

  @Column('text')
  message: string;

  @Column({ type: 'enum', enum: ['active', 'resolved'], default: 'active' })
  status: string;

  @CreateDateColumn()
  timestamp: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
