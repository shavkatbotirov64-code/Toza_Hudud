import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  vehicleId: string; // VEH-001

  @Column({ type: 'varchar', length: 100 })
  driver: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'varchar', length: 20, default: 'idle' })
  status: string; // 'idle', 'moving', 'cleaning', 'stopped'

  @Column({ type: 'boolean', default: false })
  isMoving: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  targetBinId: string | null; // Qaysi qutiga bormoqda

  @Column({ type: 'timestamp', nullable: true })
  lastCleaningTime: Date;

  @Column({ type: 'int', default: 0 })
  totalCleanings: number; // Jami tozalashlar soni

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalDistanceTraveled: number; // Jami bosib o'tgan masofa (km)

  // Patrol state
  @Column({ type: 'boolean', default: true })
  isPatrolling: boolean; // Patrol qilyaptimi

  @Column({ type: 'boolean', default: false })
  hasCleanedOnce: boolean; // Bir marta tozaladimi

  @Column({ type: 'int', default: 0 })
  patrolIndex: number; // Patrol marshrut indexi

  @Column({ type: 'jsonb', nullable: true })
  patrolRoute: any; // Patrol marshrut nuqtalari

  @Column({ type: 'jsonb', nullable: true })
  currentRoute: any; // Hozirgi marshrut (qutiga borayotganda)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
