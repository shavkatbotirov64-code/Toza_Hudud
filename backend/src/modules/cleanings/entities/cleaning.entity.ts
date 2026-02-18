import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('cleanings')
export class Cleaning {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  binId: string; // Qaysi quti tozalangan

  @Column({ type: 'varchar', length: 50 })
  vehicleId: string; // Qaysi mashina tozalagan

  @Column({ type: 'varchar', length: 100 })
  driverName: string; // Haydovchi ismi

  @Column({ type: 'varchar', length: 255 })
  binLocation: string; // Quti joylashuvi

  @Column({ type: 'int', default: 0 })
  fillLevelBefore: number; // Tozalashdan oldin to'lish darajasi (%)

  @Column({ type: 'int', default: 15 })
  fillLevelAfter: number; // Tozalashdan keyin to'lish darajasi (%)

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  distanceTraveled: number; // Bosib o'tgan masofa (km)

  @Column({ type: 'int', nullable: true })
  durationMinutes: number; // Tozalash davomiyligi (daqiqa)

  @Column({ type: 'text', nullable: true })
  notes: string; // Qo'shimcha izohlar

  @Column({ type: 'varchar', length: 20, default: 'completed' })
  status: string; // 'completed', 'partial', 'failed'

  // ✨ YANGI: Marshrut ma'lumotlari
  @Column({ type: 'jsonb', nullable: true })
  routePath: any; // Marshrut nuqtalari [[lat, lon], [lat, lon], ...]

  @Column({ type: 'timestamp', nullable: true })
  startTime: Date; // Tozalash boshlangan vaqt (qutiga yo'l olgan vaqt)

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date; // Tozalash tugagan vaqt

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  averageSpeed: number; // O'rtacha tezlik (km/h)

  @CreateDateColumn()
  cleanedAt: Date; // Tozalash vaqti
}
