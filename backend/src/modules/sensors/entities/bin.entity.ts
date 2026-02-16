import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('bins')
export class Bin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  binId: string; // ESP32-IBN-SINO

  @Column({ type: 'varchar', length: 50 })
  code: string; // Quti kodi (binId bilan bir xil)

  @Column({ type: 'varchar', length: 255 })
  location: string; // Samarqand

  @Column({ type: 'varchar', length: 255 })
  address: string; // To'liq manzil

  @Column({ type: 'varchar', length: 100, default: 'Samarqand' })
  district: string; // Tuman nomi

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'varchar', length: 20, default: 'EMPTY' })
  status: string; // 'EMPTY' or 'FULL'

  @Column({ type: 'int', default: 15 })
  fillLevel: number; // 0-100%

  @Column({ type: 'int', default: 120 })
  capacity: number; // Litr

  @Column({ type: 'varchar', length: 50, default: 'standard' })
  type: string; // Quti turi: standard, large, small

  @Column({ type: 'varchar', length: 50, nullable: true })
  sensorId: string; // Sensor ID

  @Column({ type: 'boolean', default: true })
  isOnline: boolean; // Online/Offline holati

  @Column({ type: 'int', default: 100 })
  batteryLevel: number; // Batareya darajasi (0-100%)

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  lastDistance: number; // Oxirgi o'lchangan masofa (sm)

  @Column({ type: 'timestamp', nullable: true })
  lastCleaningTime: Date;

  @Column({ type: 'int', default: 0 })
  totalCleanings: number; // Jami tozalashlar soni

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
