import { Controller, Get, Post, Put, Delete, Body, Param, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  @ApiOperation({ summary: 'Xabar yuborish' })
  @ApiResponse({ status: 200, description: 'Xabar yuborildi' })
  async sendNotification(@Body() data: {
    title: string;
    message: string;
    type: string;
    userId?: string;
    vehicleId?: string;
    binId?: string;
    actionUrl?: string;
    metadata?: any;
  }) {
    try {
      const result = await this.notificationsService.sendNotification(data);
      return result;
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('list')
  @ApiOperation({ summary: 'Barcha xabarlar' })
  @ApiResponse({ status: 200, description: 'Xabarlar ro\'yxati' })
  async getAllNotifications(
    @Query('userId') userId?: string,
    @Query('limit') limit: string = '50',
  ) {
    try {
      const notifications = await this.notificationsService.getAllNotifications(
        userId,
        parseInt(limit),
      );
      return {
        success: true,
        data: notifications,
      };
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  @Get('unread')
  @ApiOperation({ summary: 'O\'qilmagan xabarlar' })
  @ApiResponse({ status: 200, description: 'O\'qilmagan xabarlar' })
  async getUnreadNotifications(@Query('userId') userId?: string) {
    try {
      const notifications = await this.notificationsService.getUnreadNotifications(userId);
      return {
        success: true,
        data: notifications,
        count: notifications.length,
      };
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: [],
        count: 0,
      };
    }
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'O\'qilgan deb belgilash' })
  @ApiResponse({ status: 200, description: 'O\'qilgan deb belgilandi' })
  async markAsRead(@Param('id') id: string) {
    try {
      const result = await this.notificationsService.markAsRead(id);
      return result;
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Hammasini o\'qilgan deb belgilash' })
  @ApiResponse({ status: 200, description: 'Hammasi o\'qilgan' })
  async markAllAsRead(@Query('userId') userId?: string) {
    try {
      const result = await this.notificationsService.markAllAsRead(userId);
      return result;
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xabarni o\'chirish' })
  @ApiResponse({ status: 200, description: 'Xabar o\'chirildi' })
  async deleteNotification(@Param('id') id: string) {
    try {
      const result = await this.notificationsService.deleteNotification(id);
      return result;
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Eski xabarlarni tozalash (30 kundan eski)' })
  @ApiResponse({ status: 200, description: 'Tozalash natijasi' })
  async cleanOldNotifications() {
    try {
      const result = await this.notificationsService.cleanOldNotifications();
      return result;
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Helper endpoints

  @Post('bin-full')
  @ApiOperation({ summary: 'Quti to\'ldi xabari' })
  async notifyBinFull(@Body() data: { binId: string; fillLevel: number }) {
    try {
      const result = await this.notificationsService.notifyBinFull(
        data.binId,
        data.fillLevel,
      );
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('cleaning-completed')
  @ApiOperation({ summary: 'Tozalash tugadi xabari' })
  async notifyCleaningCompleted(@Body() data: { vehicleId: string; binId: string }) {
    try {
      const result = await this.notificationsService.notifyCleaningCompleted(
        data.vehicleId,
        data.binId,
      );
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('vehicle-offline')
  @ApiOperation({ summary: 'Mashina offline xabari' })
  async notifyVehicleOffline(@Body() data: { vehicleId: string }) {
    try {
      const result = await this.notificationsService.notifyVehicleOffline(data.vehicleId);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('route-ready')
  @ApiOperation({ summary: 'Marshrut tayyor xabari' })
  async notifyRouteReady(@Body() data: { vehicleId: string; routeId: string; distance: number }) {
    try {
      const result = await this.notificationsService.notifyRouteReady(
        data.vehicleId,
        data.routeId,
        data.distance,
      );
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
