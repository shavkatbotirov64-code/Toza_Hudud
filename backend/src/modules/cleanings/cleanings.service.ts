import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cleaning } from './entities/cleaning.entity';
import { ActivitiesService } from '../activities/activities.service';
import { BinsService } from '../sensors/bins.service';

@Injectable()
export class CleaningsService {
  private readonly logger = new Logger(CleaningsService.name);

  constructor(
    @InjectRepository(Cleaning)
    private cleaningRepository: Repository<Cleaning>,
    private readonly activitiesService: ActivitiesService,
    private readonly binsService: BinsService,
  ) {}

  // Tozalash yozuvi yaratish
  async createCleaning(data: {
    binId: string;
    vehicleId: string;
    driverName: string;
    binLocation: string;
    fillLevelBefore?: number;
    fillLevelAfter?: number;
    distanceTraveled?: number;
    durationMinutes?: number;
    notes?: string;
    status?: string;
    // ✨ YANGI: Marshrut ma'lumotlari
    routePath?: any;
    startTime?: Date;
    endTime?: Date;
    averageSpeed?: number;
  }): Promise<Cleaning> {
    try {
      const cleaning = this.cleaningRepository.create({
        binId: data.binId,
        vehicleId: data.vehicleId,
        driverName: data.driverName,
        binLocation: data.binLocation,
        fillLevelBefore: data.fillLevelBefore || 95,
        fillLevelAfter: data.fillLevelAfter || 15,
        distanceTraveled: data.distanceTraveled,
        durationMinutes: data.durationMinutes,
        notes: data.notes,
        status: data.status || 'completed',
        // ✨ YANGI: Marshrut ma'lumotlari
        routePath: data.routePath,
        startTime: data.startTime,
        endTime: data.endTime,
        averageSpeed: data.averageSpeed,
      });

      const saved = await this.cleaningRepository.save(cleaning);
      this.logger.log(`🧹 Cleaning record created: ${saved.binId} by ${saved.vehicleId}`);
      
      // Log marshrut ma'lumotlari
      if (data.routePath) {
        this.logger.log(`📍 Route path saved: ${data.routePath.length} points`);
      }
      if (data.startTime && data.endTime) {
        const duration = (data.endTime.getTime() - data.startTime.getTime()) / 1000 / 60;
        this.logger.log(`⏱️ Duration: ${duration.toFixed(1)} minutes`);
      }
      if (data.averageSpeed) {
        this.logger.log(`🚗 Average speed: ${data.averageSpeed} km/h`);
      }
      
      // 🗑️ Qutini tozalash - fillLevel'ni 15 ga o'zgartirish
      try {
        await this.binsService.cleanBin(data.binId);
        this.logger.log(`✅ Bin ${data.binId} fillLevel updated to 15`);
      } catch (binError) {
        this.logger.error(`❌ Error updating bin fillLevel: ${binError.message}`);
      }
      
      // 📋 Faoliyat yaratish: Quti tozalandi
      try {
        await this.activitiesService.logBinCleaned(data.binId, data.binLocation);
        this.logger.log(`📋 Activity logged: Bin ${data.binId} cleaned`);
      } catch (activityError) {
        this.logger.error(`❌ Error logging activity: ${activityError.message}`);
      }
      
      return saved;
    } catch (error) {
      this.logger.error(`❌ Error creating cleaning record: ${error.message}`);
      throw error;
    }
  }

  // Barcha tozalashlar tarixi
  async getCleaningHistory(limit: number = 50): Promise<Cleaning[]> {
    try {
      const cleanings = await this.cleaningRepository.find({
        order: { cleanedAt: 'DESC' },
        take: limit,
      });
      this.logger.log(`📊 Retrieved ${cleanings.length} cleaning records`);
      return cleanings;
    } catch (error) {
      this.logger.error(`❌ Error getting cleaning history: ${error.message}`);
      return [];
    }
  }

  // Quti bo'yicha tozalashlar
  async getCleaningsByBin(binId: string, limit: number = 20): Promise<Cleaning[]> {
    try {
      const cleanings = await this.cleaningRepository.find({
        where: { binId },
        order: { cleanedAt: 'DESC' },
        take: limit,
      });
      this.logger.log(`🗑️ Retrieved ${cleanings.length} cleanings for bin ${binId}`);
      return cleanings;
    } catch (error) {
      this.logger.error(`❌ Error getting cleanings by bin: ${error.message}`);
      return [];
    }
  }

  // Mashina bo'yicha tozalashlar
  async getCleaningsByVehicle(vehicleId: string, limit: number = 20): Promise<Cleaning[]> {
    try {
      const cleanings = await this.cleaningRepository.find({
        where: { vehicleId },
        order: { cleanedAt: 'DESC' },
        take: limit,
      });
      this.logger.log(`🚛 Retrieved ${cleanings.length} cleanings for vehicle ${vehicleId}`);
      return cleanings;
    } catch (error) {
      this.logger.error(`❌ Error getting cleanings by vehicle: ${error.message}`);
      return [];
    }
  }

  // Tozalash statistikasi
  async getCleaningStats(): Promise<any> {
    try {
      // Jami tozalashlar
      const totalCleanings = await this.cleaningRepository.count();

      // Bugungi tozalashlar
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayCleanings = await this.cleaningRepository.count({
        where: {
          cleanedAt: Between(today, tomorrow),
        },
      });

      // Haftalik tozalashlar
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weeklyCleanings = await this.cleaningRepository.count({
        where: {
          cleanedAt: Between(weekAgo, new Date()),
        },
      });

      // Oylik tozalashlar
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const monthlyCleanings = await this.cleaningRepository.count({
        where: {
          cleanedAt: Between(monthAgo, new Date()),
        },
      });

      // O'rtacha tozalash vaqti
      const avgDurationResult = await this.cleaningRepository
        .createQueryBuilder('cleaning')
        .select('AVG(cleaning.durationMinutes)', 'avg')
        .getRawOne();

      // Eng ko'p tozalangan quti
      const topBinResult = await this.cleaningRepository
        .createQueryBuilder('cleaning')
        .select('cleaning.binId', 'binId')
        .addSelect('COUNT(*)', 'count')
        .groupBy('cleaning.binId')
        .orderBy('count', 'DESC')
        .limit(1)
        .getRawOne();

      // Eng faol mashina
      const topVehicleResult = await this.cleaningRepository
        .createQueryBuilder('cleaning')
        .select('cleaning.vehicleId', 'vehicleId')
        .addSelect('COUNT(*)', 'count')
        .groupBy('cleaning.vehicleId')
        .orderBy('count', 'DESC')
        .limit(1)
        .getRawOne();

      const stats = {
        totalCleanings,
        todayCleanings,
        weeklyCleanings,
        monthlyCleanings,
        averageDurationMinutes: avgDurationResult?.avg 
          ? Math.round(parseFloat(avgDurationResult.avg)) 
          : 0,
        topBin: topBinResult || null,
        topVehicle: topVehicleResult || null,
      };

      this.logger.log(`📈 Cleaning stats: ${totalCleanings} total, ${todayCleanings} today`);
      return stats;
    } catch (error) {
      this.logger.error(`❌ Error getting cleaning stats: ${error.message}`);
      return {
        totalCleanings: 0,
        todayCleanings: 0,
        weeklyCleanings: 0,
        monthlyCleanings: 0,
        averageDurationMinutes: 0,
        topBin: null,
        topVehicle: null,
      };
    }
  }

  // Kunlik tozalashlar (oxirgi 7 kun)
  async getDailyCleanings(): Promise<any[]> {
    try {
      const result = await this.cleaningRepository
        .createQueryBuilder('cleaning')
        .select("DATE(cleaning.cleanedAt)", 'date')
        .addSelect('COUNT(*)', 'count')
        .where('cleaning.cleanedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)')
        .groupBy('DATE(cleaning.cleanedAt)')
        .orderBy('date', 'ASC')
        .getRawMany();

      return result;
    } catch (error) {
      this.logger.error(`❌ Error getting daily cleanings: ${error.message}`);
      return [];
    }
  }
}
