import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { TelegramDataService } from './telegram-data.service';
import { TelegramUser } from './entities/telegram-user.entity';
import { TelegramProblem } from './entities/telegram-problem.entity';
import { TelegramRating } from './entities/telegram-rating.entity';
import { TelegramFeedback } from './entities/telegram-feedback.entity';
import { TelegramSubscriber } from './entities/telegram-subscriber.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TelegramUser,
      TelegramProblem,
      TelegramRating,
      TelegramFeedback,
      TelegramSubscriber,
    ]),
  ],
  controllers: [TelegramController],
  providers: [TelegramService, TelegramDataService],
  exports: [TelegramService, TelegramDataService],
})
export class TelegramModule {}