import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('dispatches')
export class Dispatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  vehicleId: string; // Qaysi mashina yuborilgan

  @Column({ type: 'varchar', length: 50 })
  binId: string; // Qaysi qutiga yuborilgan

  @Column({ type: 'varchar', length: 255, nullable: true })
  binAddress: string; // Quti manzili

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  distance: number; // Masofa (km)

  @Column({ type: 'int', nullable: true })
  estimatedTime: number; // Taxminiy vaqt (daqiqa)

  @Column({ type: 'varchar', length: 20, default: 'medium' })
  priority: string; // 'low', 'medium', 'high', 'urgent'

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string; // 'pending', 'in-progress', 'completed', 'cancelled'

  @Column({ type: 'text', nullable: true })
  notes: string; // Qo'shimcha izohlar

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date; // Yo'lga chiqqan vaqt

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date; // Tugagan vaqt

  @CreateDateColumn()
  createdAt: Date; // Dispatch yaratilgan vaqt

  @UpdateDateColumn()
  updatedAt: Date;
}
