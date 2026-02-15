import { Entity, Column, PrimaryColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { TelegramProblem } from './telegram-problem.entity';
import { TelegramRating } from './telegram-rating.entity';
import { TelegramFeedback } from './telegram-feedback.entity';

@Entity('telegram_users')
export class TelegramUser {
  @PrimaryColumn({ type: 'bigint' })
  user_id: number;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  phone: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => TelegramProblem, problem => problem.user)
  problems: TelegramProblem[];

  @OneToMany(() => TelegramRating, rating => rating.user)
  ratings: TelegramRating[];

  @OneToMany(() => TelegramFeedback, feedback => feedback.user)
  feedbacks: TelegramFeedback[];
}
