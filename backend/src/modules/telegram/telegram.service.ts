import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly webhookUrl: string;

  constructor(private configService: ConfigService) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN') || '';
    this.webhookUrl = this.configService.get<string>('TELEGRAM_WEBHOOK_URL') || '';
  }

  async getBotInfo() {
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getMe`);
      const data = await response.json();
      
      if (data.ok) {
        this.logger.log('Bot info retrieved successfully');
        return {
          success: true,
          data: data.result
        };
      } else {
        throw new Error(data.description || 'Failed to get bot info');
      }
    } catch (error) {
      this.logger.error('Failed to get bot info:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async setWebhook(webhookUrl?: string) {
    try {
      const url = webhookUrl || this.webhookUrl;
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        this.logger.log(`Webhook set successfully: ${url}`);
        return {
          success: true,
          data: data.result
        };
      } else {
        throw new Error(data.description || 'Failed to set webhook');
      }
    } catch (error) {
      this.logger.error('Failed to set webhook:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendMessage(chatId: string | number, text: string) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML'
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        this.logger.log(`Message sent to ${chatId}`);
        return {
          success: true,
          data: data.result
        };
      } else {
        throw new Error(data.description || 'Failed to send message');
      }
    } catch (error) {
      this.logger.error('Failed to send message:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async broadcastMessage(text: string, userIds: (string | number)[]) {
    const results: any[] = [];
    
    for (const userId of userIds) {
      const result = await this.sendMessage(userId, text);
      results.push({ userId, ...result });
      
      // Rate limiting - 30 messages per second max
      await new Promise(resolve => setTimeout(resolve, 35));
    }
    
    return results;
  }

  async getUpdates(offset?: number) {
    try {
      const params = new URLSearchParams();
      if (offset) params.append('offset', offset.toString());
      
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getUpdates?${params}`);
      const data = await response.json();
      
      if (data.ok) {
        return {
          success: true,
          data: data.result
        };
      } else {
        throw new Error(data.description || 'Failed to get updates');
      }
    } catch (error) {
      this.logger.error('Failed to get updates:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Mock data for demo purposes
  getMockStats() {
    return {
      totalUsers: 1245 + Math.floor(Math.random() * 100),
      activeToday: 342 + Math.floor(Math.random() * 50),
      messagesReceived: 8567 + Math.floor(Math.random() * 200),
      feedbackReceived: 234 + Math.floor(Math.random() * 20)
    };
  }

  getMockMessages() {
    const messages = [
      { id: Date.now(), user: 'User123', text: 'Quti holatini ko\'rish', time: new Date().toLocaleTimeString(), type: 'message' },
      { id: Date.now() + 1, user: 'User456', text: 'Yaqin qutilarni topish', time: new Date().toLocaleTimeString(), type: 'message' },
      { id: Date.now() + 2, user: 'User789', text: 'Quti to\'ldi xabari', time: new Date().toLocaleTimeString(), type: 'alert' }
    ];
    
    return messages.slice(0, Math.floor(Math.random() * 3) + 1);
  }

  getMockFeedback() {
    const feedback = [
      { id: Date.now(), user: 'User123', text: 'Tizim juda qulay, rahmat!', time: new Date().toLocaleTimeString(), rating: 5 },
      { id: Date.now() + 1, user: 'User456', text: 'Qutilar tez to\'ldi, ko\'proq quti kerak', time: new Date().toLocaleTimeString(), rating: 4 },
      { id: Date.now() + 2, user: 'User789', text: 'Yaxshi ishlayapti', time: new Date().toLocaleTimeString(), rating: 5 }
    ];
    
    return feedback.slice(0, Math.floor(Math.random() * 3) + 1);
  }
}