import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TelegramUser } from './telegram-user.entity';

@Entity('telegram_ratings')
export class TelegramRating {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint' })
  user_id: number;

  @Column({ type: 'int' })
  rating: number;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => TelegramUser, user => user.ratings)
  @JoinColumn({ name: 'user_id' })
  user: TelegramUser;
}
