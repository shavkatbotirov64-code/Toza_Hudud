import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  type: string; // 'bin_full', 'bin_cleaned', 'bin_added', 'vehicle_arrived', 'alert', 'sensor_error'

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  binId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  vehicleId: string;

  @Column({ type: 'varchar', length: 200 })
  location: string;

  @Column({ type: 'varchar', length: 10 })
  time: string; // HH:MM format

  @CreateDateColumn()
  createdAt: Date;
}
