import { Entity, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('telegram_subscribers')
export class TelegramSubscriber {
  @PrimaryColumn({ type: 'bigint' })
  user_id: number;

  @CreateDateColumn()
  created_at: Date;
}
