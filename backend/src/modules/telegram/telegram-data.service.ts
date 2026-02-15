import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelegramUser } from './entities/telegram-user.entity';
import { TelegramProblem } from './entities/telegram-problem.entity';
import { TelegramRating } from './entities/telegram-rating.entity';
import { TelegramFeedback } from './entities/telegram-feedback.entity';
import { TelegramSubscriber } from './entities/telegram-subscriber.entity';

// Telegram ma'lumotlari uchun interfacelar - export qilingan
export interface TelegramStats {
  totalUsers: number;
  totalReports: number;
  totalRatings: number;
  totalFeedbacks: number;
  averageRating: number;
}

export interface TelegramUserInterface {
  telegram_id: number;
  name: string;
  phone: string;
  created_at: string;
}

export interface TelegramReport {
  id: number;
  user_name: string;
  user_phone: string;
  description: string;
  media_type: string;
  latitude: number;
  longitude: number;
  status: string;
  created_at: string;
}

export interface TelegramFeedbackInterface {
  id: number;
  user_name: string;
  user_phone: string;
  feedback_text: string;
  created_at: string;
}

@Injectable()
export class TelegramDataService {
  private readonly logger = new Logger(TelegramDataService.name);

  constructor(
    @InjectRepository(TelegramUser)
    private telegramUserRepository: Repository<TelegramUser>,
    @InjectRepository(TelegramProblem)
    private telegramProblemRepository: Repository<TelegramProblem>,
    @InjectRepository(TelegramRating)
    private telegramRatingRepository: Repository<TelegramRating>,
    @InjectRepository(TelegramFeedback)
    private telegramFeedbackRepository: Repository<TelegramFeedback>,
    @InjectRepository(TelegramSubscriber)
    private telegramSubscriberRepository: Repository<TelegramSubscriber>,
  ) {}

  /**
   * Telegram bot statistikasini olish
   */
  async getTelegramStats(): Promise<TelegramStats> {
    try {
      const [totalUsers, totalReports, totalRatings, totalFeedbacks] = await Promise.all([
        this.telegramSubscriberRepository.count(),
        this.telegramProblemRepository.count(),
        this.telegramRatingRepository.count(),
        this.telegramFeedbackRepository.count(),
      ]);

      // O'rtacha reytingni hisoblash
      const ratingsResult = await this.telegramRatingRepository
        .createQueryBuilder('rating')
        .select('AVG(rating.rating)', 'average')
        .getRawOne();

      const averageRating = ratingsResult?.average ? parseFloat(ratingsResult.average) : 0;

      return {
        totalUsers,
        totalReports,
        totalRatings,
        totalFeedbacks,
        averageRating: Math.round(averageRating * 10) / 10,
      };
    } catch (error) {
      this.logger.error(`Error getting Telegram stats: ${error.message}`);
      // Demo ma'lumotlar qaytarish
      return {
        totalUsers: 0,
        totalReports: 0,
        totalRatings: 0,
        totalFeedbacks: 0,
        averageRating: 0,
      };
    }
  }

  /**
   * So'nggi murojaatlarni olish
   */
  async getRecentReports(limit: number = 10): Promise<TelegramReport[]> {
    try {
      const reports = await this.telegramProblemRepository
        .createQueryBuilder('problem')
        .leftJoinAndSelect('problem.user', 'user')
        .orderBy('problem.created_at', 'DESC')
        .limit(limit)
        .getMany();

      return reports.map(report => ({
        id: report.id,
        user_name: report.user?.name || 'Noma\'lum',
        user_phone: report.user?.phone || 'Noma\'lum',
        description: report.description,
        media_type: report.media_type,
        latitude: report.latitude,
        longitude: report.longitude,
        status: report.status,
        created_at: report.created_at.toISOString(),
      }));
    } catch (error) {
      this.logger.error(`Error getting recent reports: ${error.message}`);
      return [];
    }
  }

  /**
   * So'nggi fikrlarni olish
   */
  async getRecentFeedbacks(limit: number = 10): Promise<TelegramFeedbackInterface[]> {
    try {
      const feedbacks = await this.telegramFeedbackRepository
        .createQueryBuilder('feedback')
        .leftJoinAndSelect('feedback.user', 'user')
        .orderBy('feedback.created_at', 'DESC')
        .limit(limit)
        .getMany();

      return feedbacks.map(feedback => ({
        id: feedback.id,
        user_name: feedback.user?.name || 'Noma\'lum',
        user_phone: feedback.user?.phone || 'Noma\'lum',
        feedback_text: feedback.text,
        created_at: feedback.created_at.toISOString(),
      }));
    } catch (error) {
      this.logger.error(`Error getting recent feedbacks: ${error.message}`);
      return [];
    }
  }

  /**
   * Barcha foydalanuvchilar (users + subscribers) ro'yxatini olish
   */
  async getAllTelegramUsers(limit: number = 100): Promise<any[]> {
    try {
      // Avval to'liq ro'yxatdan o'tgan foydalanuvchilarni olish
      const registeredUsers = await this.telegramUserRepository
        .createQueryBuilder('user')
        .orderBy('user.created_at', 'DESC')
        .getMany();

      // Keyin faqat subscriber bo'lgan (ro'yxatdan o'tmagan) foydalanuvchilarni olish
      const subscriberOnlyUsers = await this.telegramSubscriberRepository
        .createQueryBuilder('subscriber')
        .leftJoin('telegram_users', 'user', 'subscriber.user_id = user.user_id')
        .where('user.user_id IS NULL')
        .orderBy('subscriber.created_at', 'DESC')
        .getMany();

      // Barcha foydalanuvchilarni birlashtirish
      const allUsers = [
        ...registeredUsers.map(user => ({
          telegram_id: user.user_id,
          name: user.name,
          phone: user.phone,
          created_at: user.created_at.toISOString(),
          status: 'registered',
        })),
        ...subscriberOnlyUsers.map(sub => ({
          telegram_id: sub.user_id,
          name: 'Noma\'lum',
          phone: 'Noma\'lum',
          created_at: sub.created_at.toISOString(),
          status: 'subscriber_only',
        })),
      ];

      // Sana bo'yicha tartiblash va limit qo'llash
      return allUsers
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
    } catch (error) {
      this.logger.error(`Error getting all Telegram users: ${error.message}`);
      return [];
    }
  }

  /**
   * Foydalanuvchilar ro'yxatini olish (faqat to'liq ro'yxatdan o'tganlar)
   */
  async getTelegramUsers(limit: number = 50): Promise<TelegramUserInterface[]> {
    try {
      const users = await this.telegramUserRepository
        .createQueryBuilder('user')
        .orderBy('user.created_at', 'DESC')
        .limit(limit)
        .getMany();

      return users.map(user => ({
        telegram_id: user.user_id,
        name: user.name,
        phone: user.phone,
        created_at: user.created_at.toISOString(),
      }));
    } catch (error) {
      this.logger.error(`Error getting Telegram users: ${error.message}`);
      return [];
    }
  }

  /**
   * Reytinglar statistikasini olish
   */
  async getRatingsStats(): Promise<{ rating: number; count: number }[]> {
    try {
      const stats = await this.telegramRatingRepository
        .createQueryBuilder('rating')
        .select('rating.rating', 'rating')
        .addSelect('COUNT(*)', 'count')
        .groupBy('rating.rating')
        .orderBy('rating.rating', 'ASC')
        .getRawMany();

      return stats.map(stat => ({
        rating: parseInt(stat.rating),
        count: parseInt(stat.count),
      }));
    } catch (error) {
      this.logger.error(`Error getting ratings stats: ${error.message}`);
      return [];
    }
  }

  /**
   * Kunlik statistika (oxirgi 7 kun)
   */
  async getDailyStats(): Promise<{ date: string; reports: number; users: number }[]> {
    try {
      // Oxirgi 7 kunlik murojaatlar
      const reportStats = await this.telegramProblemRepository
        .createQueryBuilder('problem')
        .select('DATE(problem.created_at)', 'date')
        .addSelect('COUNT(*)', 'reports')
        .where('problem.created_at >= NOW() - INTERVAL \'7 days\'')
        .groupBy('DATE(problem.created_at)')
        .orderBy('date', 'DESC')
        .getRawMany();

      // Oxirgi 7 kunlik foydalanuvchilar
      const userStats = await this.telegramUserRepository
        .createQueryBuilder('user')
        .select('DATE(user.created_at)', 'date')
        .addSelect('COUNT(*)', 'users')
        .where('user.created_at >= NOW() - INTERVAL \'7 days\'')
        .groupBy('DATE(user.created_at)')
        .orderBy('date', 'DESC')
        .getRawMany();

      // Ma'lumotlarni birlashtirish
      const statsMap = new Map();

      reportStats.forEach(stat => {
        statsMap.set(stat.date, { date: stat.date, reports: parseInt(stat.reports), users: 0 });
      });

      userStats.forEach(stat => {
        if (statsMap.has(stat.date)) {
          statsMap.get(stat.date).users = parseInt(stat.users);
        } else {
          statsMap.set(stat.date, { date: stat.date, reports: 0, users: parseInt(stat.users) });
        }
      });

      return Array.from(statsMap.values()).sort((a, b) => b.date.localeCompare(a.date));
    } catch (error) {
      this.logger.error(`Error getting daily stats: ${error.message}`);
      return [];
    }
  }
}
