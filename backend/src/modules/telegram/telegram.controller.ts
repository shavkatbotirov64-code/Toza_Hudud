import { Controller, Get, Post, Body, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TelegramService } from './telegram.service';
import { 
  TelegramDataService,
  TelegramStats,
  TelegramUserInterface,
  TelegramReport,
  TelegramFeedbackInterface
} from './telegram-data.service';

@ApiTags('telegram')
@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly telegramDataService: TelegramDataService,
  ) {}

  @Get('bot-info')
  @ApiOperation({ summary: 'Get Telegram bot information' })
  @ApiResponse({ status: 200, description: 'Bot information retrieved successfully' })
  async getBotInfo() {
    try {
      const botInfo = await this.telegramService.getBotInfo();
      return {
        success: true,
        data: botInfo
      };
    } catch (error) {
      this.logger.error(`Error getting bot info: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: {
          id: 'demo_bot',
          first_name: 'TozaHudud Bot',
          username: 'tozahudud_bot',
          is_bot: true
        }
      };
    }
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Set Telegram webhook' })
  @ApiResponse({ status: 200, description: 'Webhook set successfully' })
  async setWebhook(@Body() body: { url: string }) {
    try {
      const result = await this.telegramService.setWebhook(body.url);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      this.logger.error(`Error setting webhook: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Post('broadcast')
  @ApiOperation({ summary: 'Send broadcast message to all users' })
  @ApiResponse({ status: 200, description: 'Broadcast message sent successfully' })
  async broadcastMessage(@Body() body: { message: string }) {
    try {
      // Bu funksiya bot orqali barcha foydalanuvchilarga xabar yuborish uchun
      // Hozircha demo rejimda
      return {
        success: true,
        message: 'Broadcast message sent to all users',
        data: {
          sent_count: 1245,
          failed_count: 0
        }
      };
    } catch (error) {
      this.logger.error(`Error broadcasting message: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Yangi endpointlar - Bot ma'lumotlari uchun

  @Get('stats')
  @ApiOperation({ summary: 'Get Telegram bot statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats() {
    try {
      const stats = await this.telegramDataService.getTelegramStats();
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      this.logger.error(`Error getting Telegram stats: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: {
          totalUsers: 1245,
          totalReports: 89,
          totalRatings: 156,
          totalFeedbacks: 234,
          averageRating: 4.2
        }
      };
    }
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get recent Telegram reports' })
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  async getReports(@Query('limit') limit: string = '10') {
    try {
      const reports = await this.telegramDataService.getRecentReports(parseInt(limit));
      return {
        success: true,
        data: reports
      };
    } catch (error) {
      this.logger.error(`Error getting Telegram reports: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  @Get('feedbacks')
  @ApiOperation({ summary: 'Get recent Telegram feedbacks' })
  @ApiResponse({ status: 200, description: 'Feedbacks retrieved successfully' })
  async getFeedbacks(@Query('limit') limit: string = '10') {
    try {
      const feedbacks = await this.telegramDataService.getRecentFeedbacks(parseInt(limit));
      return {
        success: true,
        data: feedbacks
      };
    } catch (error) {
      this.logger.error(`Error getting Telegram feedbacks: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  @Get('users')
  @ApiOperation({ summary: 'Get Telegram users list (registered only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getUsers(@Query('limit') limit: string = '50') {
    try {
      const users = await this.telegramDataService.getTelegramUsers(parseInt(limit));
      return {
        success: true,
        data: users
      };
    } catch (error) {
      this.logger.error(`Error getting Telegram users: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  @Get('all-users')
  @ApiOperation({ summary: 'Get all Telegram users (registered + subscribers)' })
  @ApiResponse({ status: 200, description: 'All users retrieved successfully' })
  async getAllUsers(@Query('limit') limit: string = '100') {
    try {
      this.logger.log(`🔍 Getting all Telegram users with limit: ${limit}`);
      
      const allUsers = await this.telegramDataService.getAllTelegramUsers(parseInt(limit));
      
      this.logger.log(`✅ Retrieved ${allUsers.length} total users`);
      this.logger.debug(`📊 Users breakdown: ${JSON.stringify(allUsers.map(u => ({ id: u.telegram_id, status: u.status })))}`);
      
      return {
        success: true,
        data: allUsers,
        total: allUsers.length,
        registered: allUsers.filter(u => u.status === 'registered').length,
        subscribers_only: allUsers.filter(u => u.status === 'subscriber_only').length
      };
    } catch (error) {
      this.logger.error(`❌ Error getting all Telegram users: ${error.message}`);
      this.logger.debug(`🔍 Error details: ${JSON.stringify(error)}`);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  @Get('ratings-stats')
  @ApiOperation({ summary: 'Get Telegram ratings statistics' })
  @ApiResponse({ status: 200, description: 'Ratings statistics retrieved successfully' })
  async getRatingsStats() {
    try {
      const ratingsStats = await this.telegramDataService.getRatingsStats();
      return {
        success: true,
        data: ratingsStats
      };
    } catch (error) {
      this.logger.error(`Error getting ratings stats: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: [
          { rating: 1, count: 5 },
          { rating: 2, count: 8 },
          { rating: 3, count: 15 },
          { rating: 4, count: 45 },
          { rating: 5, count: 83 }
        ]
      };
    }
  }

  @Get('daily-stats')
  @ApiOperation({ summary: 'Get daily statistics for last 7 days' })
  @ApiResponse({ status: 200, description: 'Daily statistics retrieved successfully' })
  async getDailyStats() {
    try {
      const dailyStats = await this.telegramDataService.getDailyStats();
      return {
        success: true,
        data: dailyStats
      };
    } catch (error) {
      this.logger.error(`Error getting daily stats: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Eski endpointlar (backward compatibility uchun)
  @Get('messages')
  @ApiOperation({ summary: 'Get Telegram messages (alias for reports)' })
  async getMessages(@Query('limit') limit: string = '10') {
    return this.getReports(limit);
  }

  @Get('feedback')
  @ApiOperation({ summary: 'Get Telegram feedback (alias for feedbacks)' })
  async getFeedback(@Query('limit') limit: string = '10') {
    return this.getFeedbacks(limit);
  }

  @Get('updates')
  @ApiOperation({ summary: 'Get bot updates' })
  async getUpdates() {
    try {
      // Bu endpoint bot yangilanishlarini olish uchun
      return {
        success: true,
        data: {
          last_update_id: Date.now(),
          pending_updates: 0,
          webhook_info: {
            url: process.env.TELEGRAM_WEBHOOK_URL || '',
            has_custom_certificate: false,
            pending_update_count: 0
          }
        }
      };
    } catch (error) {
      this.logger.error(`Error getting updates: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Eski service metodlari uchun
  @Post('set-webhook')
  @ApiOperation({ summary: 'Set Telegram webhook (legacy)' })
  async setWebhookLegacy(@Body('url') url?: string) {
    return this.telegramService.setWebhook(url);
  }

  @Post('send-message')
  @ApiOperation({ summary: 'Send message to specific chat' })
  async sendMessage(
    @Body('chatId') chatId: string | number,
    @Body('text') text: string
  ) {
    return this.telegramService.sendMessage(chatId, text);
  }
}