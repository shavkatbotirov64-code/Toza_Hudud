import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
  ) {}

  // Yangi faoliyat yaratish
  async createActivity(data: {
    type: string;
    title: string;
    description: string;
    binId?: string;
    vehicleId?: string;
    location: string;
  }): Promise<Activity> {
    try {
      const time = new Date().toLocaleTimeString('uz-UZ', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      const activity = this.activityRepository.create({
        ...data,
        time,
      });

      const saved = await this.activityRepository.save(activity);
      this.logger.log(`✅ Activity created: ${saved.type} - ${saved.title}`);
      return saved;
    } catch (error) {
      this.logger.error(`❌ Error creating activity: ${error.message}`);
      throw error;
    }
  }

  // Oxirgi faoliyatlarni olish
  async getRecentActivities(limit: number = 50): Promise<Activity[]> {
    try {
      const activities = await this.activityRepository.find({
        order: { createdAt: 'DESC' },
        take: limit,
      });
      return activities;
    } catch (error) {
      this.logger.error(`❌ Error getting activities: ${error.message}`);
      return [];
    }
  }

  // Quti to'ldi faoliyati
  async logBinFull(binId: string, location: string): Promise<Activity> {
    return this.createActivity({
      type: 'bin_full',
      title: `Quti #${binId} to'ldi`,
      description: '95% to\'ldi. Mashina yuborildi',
      binId,
      location,
    });
  }

  // Mashina yetib keldi
  async logVehicleArrived(vehicleId: string, binId: string, location: string): Promise<Activity> {
    return this.createActivity({
      type: 'vehicle_arrived',
      title: `Mashina #${vehicleId} yetib keldi`,
      description: `Quti #${binId} tozalanmoqda`,
      vehicleId,
      binId,
      location,
    });
  }

  // Quti tozalandi
  async logBinCleaned(binId: string, location: string): Promise<Activity> {
    return this.createActivity({
      type: 'bin_cleaned',
      title: `Quti #${binId} tozalandi`,
      description: 'Quti bo\'sh holatga keltirildi',
      binId,
      location,
    });
  }

  // Yangi quti qo'shildi
  async logBinAdded(binId: string, location: string): Promise<Activity> {
    return this.createActivity({
      type: 'bin_added',
      title: 'Yangi quti qo\'shildi',
      description: `Quti #${binId} aktivlashtirildi`,
      binId,
      location,
    });
  }

  // Quti ogohlantirish
  async logBinWarning(binId: string, fillLevel: number, location: string): Promise<Activity> {
    return this.createActivity({
      type: 'alert',
      title: `Quti #${binId} ogohlantirish`,
      description: `${fillLevel}% to'ldi`,
      binId,
      location,
    });
  }

  // Sensor nosozligi
  async logSensorError(binId: string, location: string): Promise<Activity> {
    return this.createActivity({
      type: 'sensor_error',
      title: 'Sensor nosozligi',
      description: `Quti #${binId} sensori ishlamayapti`,
      binId,
      location,
    });
  }
}
