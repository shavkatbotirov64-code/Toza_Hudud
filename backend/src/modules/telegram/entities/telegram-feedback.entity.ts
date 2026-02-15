import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TelegramUser } from './telegram-user.entity';

@Entity('telegram_feedbacks')
export class TelegramFeedback {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint' })
  user_id: number;

  @Column({ type: 'text' })
  text: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => TelegramUser, user => user.feedbacks)
  @JoinColumn({ name: 'user_id' })
  user: TelegramUser;
}
