import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cleaning } from '../cleanings/entities/cleaning.entity';
import { Bin } from '../sensors/entities/bin.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { SensorReading } from '../sensors/entities/sensor-reading.entity';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Cleaning)
    private cleaningRepository: Repository<Cleaning>,
    @InjectRepository(Bin)
    private binRepository: Repository<Bin>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(SensorReading)
    private sensorRepository: Repository<SensorReading>,
  ) {}

  // Dashboard uchun umumiy statistika
  async getDashboardStats(): Promise<any> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Bugungi tozalashlar
      const todayCleanings = await this.cleaningRepository.count({
        where: {
          cleanedAt: Between(today, tomorrow),
        },
      });

      // Jami tozalashlar
      const totalCleanings = await this.cleaningRepository.count();

      // Jami qutilar
      const totalBins = await this.binRepository.count();

      // To'la qutilar
      const fullBins = await this.binRepository.count({
        where: { status: 'FULL' },
      });

      // Jami mashinalar
      const totalVehicles = await this.vehicleRepository.count();

      // Faol mashinalar
      const activeVehicles = await this.vehicleRepository.count({
        where: { isMoving: true },
      });

      // Bugungi jami masofa
      const todayDistance = await this.cleaningRepository
        .createQueryBuilder('cleaning')
        .select('SUM(cleaning.distanceTraveled)', 'total')
        .where('cleaning.cleanedAt >= :today', { today })
        .getRawOne();

      // Jami masofa
      const totalDistance = await this.cleaningRepository
        .createQueryBuilder('cleaning')
        .select('SUM(cleaning.distanceTraveled)', 'total')
        .getRawOne();

      // O'rtacha tozalash vaqti
      const avgDuration = await this.cleaningRepository
        .createQueryBuilder('cleaning')
        .select('AVG(cleaning.durationMinutes)', 'avg')
        .getRawOne();

      this.logger.log(`📊 Dashboard stats: ${todayCleanings} cleanings today`);

      return {
        success: true,
        data: {
          today: {
            cleanings: todayCleanings,
            distance: parseFloat(todayDistance?.total || 0).toFixed(2),
          },
          total: {
            cleanings: totalCleanings,
            bins: totalBins,
            vehicles: totalVehicles,
            distance: parseFloat(totalDistance?.total || 0).toFixed(2),
          },
          current: {
            fullBins: fullBins,
            activeVehicles: activeVehicles,
          },
          averages: {
            cleaningDuration: Math.round(parseFloat(avgDuration?.avg || 0)),
          },
        },
      };
    } catch (error) {
      this.logger.error(`❌ Dashboard stats error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Kunlik statistika
  async getDailyStats(date?: string): Promise<any> {
    try {
      const targetDate = date ? new Date(date) : new Date();
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Kunlik tozalashlar
      const cleanings = await this.cleaningRepository.find({
        where: {
          cleanedAt: Between(targetDate, nextDay),
        },
      });

      // Jami masofa
      const totalDistance = cleanings.reduce(
        (sum, c) => sum + parseFloat(c.distanceTraveled?.toString() || '0'),
        0,
      );

      // Jami vaqt
      const totalDuration = cleanings.reduce(
        (sum, c) => sum + (c.durationMinutes || 0),
        0,
      );

      // Soatlik taqsimot
      const hourlyDistribution = Array(24).fill(0);
      cleanings.forEach((c) => {
        const hour = new Date(c.cleanedAt).getHours();
        hourlyDistribution[hour]++;
      });

      this.logger.log(`📅 Daily stats: ${cleanings.length} cleanings on ${targetDate.toDateString()}`);

      return {
        success: true,
        data: {
          date: targetDate.toISOString().split('T')[0],
          cleanings: cleanings.length,
          totalDistance: parseFloat(totalDistance.toFixed(2)),
          totalDuration: totalDuration,
          averageDuration: cleanings.length > 0 ? Math.round(totalDuration / cleanings.length) : 0,
          hourlyDistribution: hourlyDistribution,
          cleaningsList: cleanings,
        },
      };
    } catch (error) {
      this.logger.error(`❌ Daily stats error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Haftalik hisobot
  async getWeeklyStats(): Promise<any> {
    try {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const cleanings = await this.cleaningRepository.find({
        where: {
          cleanedAt: Between(weekAgo, today),
        },
      });

      // Kunlik taqsimot
      const dailyStats = Array(7).fill(0).map(() => ({
        cleanings: 0,
        distance: 0,
      }));

      cleanings.forEach((c) => {
        const daysDiff = Math.floor(
          (today.getTime() - new Date(c.cleanedAt).getTime()) / (1000 * 60 * 60 * 24),
        );
        if (daysDiff >= 0 && daysDiff < 7) {
          dailyStats[6 - daysDiff].cleanings++;
          dailyStats[6 - daysDiff].distance += parseFloat(c.distanceTraveled?.toString() || '0');
        }
      });

      const totalDistance = cleanings.reduce(
        (sum, c) => sum + parseFloat(c.distanceTraveled?.toString() || '0'),
        0,
      );

      this.logger.log(`📅 Weekly stats: ${cleanings.length} cleanings`);

      return {
        success: true,
        data: {
          period: {
            from: weekAgo.toISOString().split('T')[0],
            to: today.toISOString().split('T')[0],
          },
          totalCleanings: cleanings.length,
          totalDistance: parseFloat(totalDistance.toFixed(2)),
          averagePerDay: parseFloat((cleanings.length / 7).toFixed(1)),
          dailyStats: dailyStats,
        },
      };
    } catch (error) {
      this.logger.error(`❌ Weekly stats error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Oylik hisobot
  async getMonthlyStats(year?: number, month?: number): Promise<any> {
    try {
      const targetDate = new Date();
      if (year && month) {
        targetDate.setFullYear(year, month - 1, 1);
      } else {
        targetDate.setDate(1);
      }
      targetDate.setHours(0, 0, 0, 0);

      const nextMonth = new Date(targetDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const cleanings = await this.cleaningRepository.find({
        where: {
          cleanedAt: Between(targetDate, nextMonth),
        },
      });

      const totalDistance = cleanings.reduce(
        (sum, c) => sum + parseFloat(c.distanceTraveled?.toString() || '0'),
        0,
      );

      const totalDuration = cleanings.reduce(
        (sum, c) => sum + (c.durationMinutes || 0),
        0,
      );

      // Kunlik taqsimot
      const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
      const dailyStats = Array(daysInMonth).fill(0).map(() => ({
        cleanings: 0,
        distance: 0,
      }));

      cleanings.forEach((c) => {
        const day = new Date(c.cleanedAt).getDate() - 1;
        if (day >= 0 && day < daysInMonth) {
          dailyStats[day].cleanings++;
          dailyStats[day].distance += parseFloat(c.distanceTraveled?.toString() || '0');
        }
      });

      this.logger.log(`📅 Monthly stats: ${cleanings.length} cleanings`);

      return {
        success: true,
        data: {
          year: targetDate.getFullYear(),
          month: targetDate.getMonth() + 1,
          totalCleanings: cleanings.length,
          totalDistance: parseFloat(totalDistance.toFixed(2)),
          totalDuration: totalDuration,
          averagePerDay: parseFloat((cleanings.length / daysInMonth).toFixed(1)),
          dailyStats: dailyStats,
        },
      };
    } catch (error) {
      this.logger.error(`❌ Monthly stats error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Samaradorlik ko'rsatkichlari
  async getEfficiencyStats(): Promise<any> {
    try {
      // Oxirgi 30 kun
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const cleanings = await this.cleaningRepository.find({
        where: {
          cleanedAt: Between(thirtyDaysAgo, today),
        },
      });

      // O'rtacha tozalash vaqti
      const avgDuration = cleanings.length > 0
        ? cleanings.reduce((sum, c) => sum + (c.durationMinutes || 0), 0) / cleanings.length
        : 0;

      // O'rtacha masofa
      const avgDistance = cleanings.length > 0
        ? cleanings.reduce((sum, c) => sum + parseFloat(c.distanceTraveled?.toString() || '0'), 0) / cleanings.length
        : 0;

      // Kunlik o'rtacha
      const avgPerDay = cleanings.length / 30;

      // Eng tez tozalash
      const fastestCleaning = cleanings.reduce((min, c) => 
        (c.durationMinutes || 999) < (min?.durationMinutes || 999) ? c : min
      , cleanings[0]);

      // Eng sekin tozalash
      const slowestCleaning = cleanings.reduce((max, c) => 
        (c.durationMinutes || 0) > (max?.durationMinutes || 0) ? c : max
      , cleanings[0]);

      this.logger.log(`📈 Efficiency stats calculated`);

      return {
        success: true,
        data: {
          period: {
            from: thirtyDaysAgo.toISOString().split('T')[0],
            to: today.toISOString().split('T')[0],
            days: 30,
          },
          averages: {
            cleaningsPerDay: parseFloat(avgPerDay.toFixed(2)),
            durationMinutes: Math.round(avgDuration),
            distanceKm: parseFloat(avgDistance.toFixed(2)),
          },
          records: {
            fastest: fastestCleaning ? {
              duration: fastestCleaning.durationMinutes,
              binId: fastestCleaning.binId,
              vehicleId: fastestCleaning.vehicleId,
            } : null,
            slowest: slowestCleaning ? {
              duration: slowestCleaning.durationMinutes,
              binId: slowestCleaning.binId,
              vehicleId: slowestCleaning.vehicleId,
            } : null,
          },
          totalCleanings: cleanings.length,
        },
      };
    } catch (error) {
      this.logger.error(`❌ Efficiency stats error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Qutilar statistikasi
  async getBinsStats(): Promise<any> {
    try {
      const bins = await this.binRepository.find();

      // Har bir quti uchun tozalashlar soni
      const binsWithStats = await Promise.all(
        bins.map(async (bin) => {
          const cleanings = await this.cleaningRepository.count({
            where: { binId: bin.binId },
          });

          const lastCleaning = await this.cleaningRepository.findOne({
            where: { binId: bin.binId },
            order: { cleanedAt: 'DESC' },
          });

          return {
            binId: bin.binId,
            location: bin.location,
            status: bin.status,
            fillLevel: bin.fillLevel,
            totalCleanings: cleanings,
            lastCleaning: lastCleaning?.cleanedAt || null,
          };
        }),
      );

      // Eng ko'p tozalangan qutilar
      const topBins = [...binsWithStats]
        .sort((a, b) => b.totalCleanings - a.totalCleanings)
        .slice(0, 5);

      this.logger.log(`🗑️ Bins stats: ${bins.length} bins`);

      return {
        success: true,
        data: {
          totalBins: bins.length,
          fullBins: bins.filter((b) => b.status === 'FULL').length,
          emptyBins: bins.filter((b) => b.status === 'EMPTY').length,
          topBins: topBins,
          allBins: binsWithStats,
        },
      };
    } catch (error) {
      this.logger.error(`❌ Bins stats error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Mashinalar statistikasi
  async getVehiclesStats(): Promise<any> {
    try {
      const vehicles = await this.vehicleRepository.find();

      // Har bir mashina uchun statistika
      const vehiclesWithStats = await Promise.all(
        vehicles.map(async (vehicle) => {
          const cleanings = await this.cleaningRepository.count({
            where: { vehicleId: vehicle.vehicleId },
          });

          const totalDistance = await this.cleaningRepository
            .createQueryBuilder('cleaning')
            .select('SUM(cleaning.distanceTraveled)', 'total')
            .where('cleaning.vehicleId = :vehicleId', { vehicleId: vehicle.vehicleId })
            .getRawOne();

          return {
            vehicleId: vehicle.vehicleId,
            driver: vehicle.driver,
            status: vehicle.status,
            isMoving: vehicle.isMoving,
            totalCleanings: cleanings,
            totalDistance: parseFloat(totalDistance?.total || 0).toFixed(2),
            lastCleaningTime: vehicle.lastCleaningTime,
          };
        }),
      );

      // Eng faol mashinalar
      const topVehicles = [...vehiclesWithStats]
        .sort((a, b) => b.totalCleanings - a.totalCleanings)
        .slice(0, 5);

      this.logger.log(`🚛 Vehicles stats: ${vehicles.length} vehicles`);

      return {
        success: true,
        data: {
          totalVehicles: vehicles.length,
          activeVehicles: vehicles.filter((v) => v.isMoving).length,
          topVehicles: topVehicles,
          allVehicles: vehiclesWithStats,
        },
      };
    } catch (error) {
      this.logger.error(`❌ Vehicles stats error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
