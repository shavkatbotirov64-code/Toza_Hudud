import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column()
  type: string; // 'info', 'warning', 'error', 'success'

  @Column({ nullable: true })
  @Index()
  userId: string; // Kimga yuborilgan (null = hammaga)

  @Column({ nullable: true })
  vehicleId: string;

  @Column({ nullable: true })
  binId: string;

  @Column({ default: false })
  @Index()
  isRead: boolean;

  @Column({ nullable: true })
  actionUrl: string; // Bosilganda qayerga o'tsin

  @Column('simple-json', { nullable: true })
  metadata: any; // Qo'shimcha ma'lumotlar

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;
}
