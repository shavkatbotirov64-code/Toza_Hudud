import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private notificationsGateway: NotificationsGateway,
  ) {}

  // Xabar yuborish
  async sendNotification(data: {
    title: string;
    message: string;
    type: string;
    userId?: string;
    vehicleId?: string;
    binId?: string;
    actionUrl?: string;
    metadata?: any;
  }): Promise<any> {
    try {
      // Database ga saqlash
      const notification = this.notificationRepository.create({
        title: data.title,
        message: data.message,
        type: data.type,
        userId: data.userId,
        vehicleId: data.vehicleId,
        binId: data.binId,
        actionUrl: data.actionUrl,
        metadata: data.metadata,
        isRead: false,
      });

      const saved = await this.notificationRepository.save(notification);

      // WebSocket orqali real-time yuborish
      this.notificationsGateway.sendNotification(saved);

      this.logger.log(`📬 Notification sent: ${saved.title} (${saved.type})`);

      return {
        success: true,
        data: saved,
      };
    } catch (error) {
      this.logger.error(`❌ Send notification error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Barcha xabarlar
  async getAllNotifications(userId?: string, limit: number = 50): Promise<Notification[]> {
    try {
      const query: any = {};
      if (userId) {
        query.userId = userId;
      }

      const notifications = await this.notificationRepository.find({
        where: query,
        order: { createdAt: 'DESC' },
        take: limit,
      });

      this.logger.log(`📋 Retrieved ${notifications.length} notifications`);
      return notifications;
    } catch (error) {
      this.logger.error(`❌ Get notifications error: ${error.message}`);
      return [];
    }
  }

  // O'qilmagan xabarlar
  async getUnreadNotifications(userId?: string): Promise<Notification[]> {
    try {
      const query: any = { isRead: false };
      if (userId) {
        query.userId = userId;
      }

      const notifications = await this.notificationRepository.find({
        where: query,
        order: { createdAt: 'DESC' },
      });

      this.logger.log(`📋 Retrieved ${notifications.length} unread notifications`);
      return notifications;
    } catch (error) {
      this.logger.error(`❌ Get unread notifications error: ${error.message}`);
      return [];
    }
  }

  // O'qilgan deb belgilash
  async markAsRead(id: string): Promise<any> {
    try {
      const notification = await this.notificationRepository.findOne({
        where: { id },
      });

      if (!notification) {
        return {
          success: false,
          message: 'Notification topilmadi',
        };
      }

      notification.isRead = true;
      notification.readAt = new Date();

      await this.notificationRepository.save(notification);

      this.logger.log(`✅ Notification marked as read: ${id}`);

      return {
        success: true,
        data: notification,
      };
    } catch (error) {
      this.logger.error(`❌ Mark as read error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Hammasini o'qilgan deb belgilash
  async markAllAsRead(userId?: string): Promise<any> {
    try {
      const query: any = { isRead: false };
      if (userId) {
        query.userId = userId;
      }

      const result = await this.notificationRepository.update(query, {
        isRead: true,
        readAt: new Date(),
      });

      this.logger.log(`✅ Marked ${result.affected} notifications as read`);

      return {
        success: true,
        count: result.affected,
      };
    } catch (error) {
      this.logger.error(`❌ Mark all as read error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Xabarni o'chirish
  async deleteNotification(id: string): Promise<any> {
    try {
      const result = await this.notificationRepository.delete(id);

      if (result.affected === 0) {
        return {
          success: false,
          message: 'Notification topilmadi',
        };
      }

      this.logger.log(`🗑️ Notification deleted: ${id}`);

      return {
        success: true,
      };
    } catch (error) {
      this.logger.error(`❌ Delete notification error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Eski xabarlarni tozalash (30 kundan eski)
  async cleanOldNotifications(): Promise<any> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.notificationRepository
        .createQueryBuilder()
        .delete()
        .where('createdAt < :date', { date: thirtyDaysAgo })
        .execute();

      this.logger.log(`🧹 Cleaned ${result.affected} old notifications`);

      return {
        success: true,
        deleted: result.affected,
      };
    } catch (error) {
      this.logger.error(`❌ Clean notifications error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Helper metodlar - tez xabar yuborish uchun

  // Quti to'lganda
  async notifyBinFull(binId: string, fillLevel: number) {
    return this.sendNotification({
      title: 'Quti to\'ldi!',
      message: `${binId} qutisi ${fillLevel}% to'ldi. Tozalash kerak.`,
      type: 'warning',
      binId: binId,
      actionUrl: `/map?bin=${binId}`,
      metadata: { fillLevel },
    });
  }

  // Tozalash tugaganda
  async notifyCleaningCompleted(vehicleId: string, binId: string) {
    return this.sendNotification({
      title: 'Tozalash tugadi',
      message: `${vehicleId} mashina ${binId} qutini tozaladi.`,
      type: 'success',
      vehicleId: vehicleId,
      binId: binId,
      actionUrl: `/cleanings`,
      metadata: { vehicleId, binId },
    });
  }

  // Mashina ishdan chiqqanda
  async notifyVehicleOffline(vehicleId: string) {
    return this.sendNotification({
      title: 'Mashina offline',
      message: `${vehicleId} mashina aloqadan chiqdi.`,
      type: 'error',
      vehicleId: vehicleId,
      actionUrl: `/vehicles/${vehicleId}`,
      metadata: { vehicleId },
    });
  }

  // Yangi marshrut tayyor
  async notifyRouteReady(vehicleId: string, routeId: string, distance: number) {
    return this.sendNotification({
      title: 'Yangi marshrut',
      message: `${vehicleId} uchun ${distance} km marshrut tayyor.`,
      type: 'info',
      vehicleId: vehicleId,
      actionUrl: `/routes/${routeId}`,
      metadata: { vehicleId, routeId, distance },
    });
  }
}
