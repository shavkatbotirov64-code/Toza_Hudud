import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TelegramUser } from './telegram-user.entity';

@Entity('telegram_problems')
export class TelegramProblem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint' })
  user_id: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  media_type: string;

  @Column({ nullable: true })
  file_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ default: 'Kutilmoqda' })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => TelegramUser, user => user.problems)
  @JoinColumn({ name: 'user_id' })
  user: TelegramUser;
}
