import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SensorReading } from './entities/sensor-reading.entity';
import { SensorAlert } from './entities/sensor-alert.entity';

@Injectable()
export class SensorsService {
  private readonly logger = new Logger(SensorsService.name);

  constructor(
    @InjectRepository(SensorReading)
    private sensorReadingRepository: Repository<SensorReading>,
    @InjectRepository(SensorAlert)
    private sensorAlertRepository: Repository<SensorAlert>,
  ) {}

  async saveSensorData(sensorData: any): Promise<any> {
    try {
      const reading = this.sensorReadingRepository.create({
        distance: sensorData.distance,
        binId: sensorData.binId || 'ESP32-001',
        location: sensorData.location || 'Sensor Location',
        isAlert: sensorData.distance <= 20,
      });

      const savedReading = await this.sensorReadingRepository.save(reading);
      this.logger.log(`✅ Sensor data saved to NEON DATABASE: ${savedReading.distance} sm | ID: ${savedReading.id}`);

      return savedReading;
    } catch (error) {
      this.logger.error(`❌ Error saving sensor data to database: ${error.message}`);
      throw error;
    }
  }

  async createAlert(sensorData: any): Promise<any> {
    try {
      const alert = this.sensorAlertRepository.create({
        distance: sensorData.distance,
        binId: sensorData.binId || 'ESP32-001',
        location: sensorData.location || 'Sensor Location',
        message: `⚠️ ALERT! Chiqindi quti to'la! Masofa: ${sensorData.distance} sm`,
        status: 'active',
      });

      const savedAlert = await this.sensorAlertRepository.save(alert);
      this.logger.warn(`🚨 Alert created in NEON DATABASE: ${savedAlert.message} | ID: ${savedAlert.id}`);

      return savedAlert;
    } catch (error) {
      this.logger.error(`❌ Error creating alert in database: ${error.message}`);
      throw error;
    }
  }

  async getLatestData(limit: number = 10): Promise<any[]> {
    try {
      const readings = await this.sensorReadingRepository.find({
        order: { timestamp: 'DESC' },
        take: limit,
      });

      this.logger.log(`📊 Retrieved ${readings.length} readings from NEON DATABASE`);
      return readings;
    } catch (error) {
      this.logger.error(`❌ Error getting latest data from database: ${error.message}`);
      return [];
    }
  }

  async getAlerts(limit: number = 20): Promise<any[]> {
    try {
      const alerts = await this.sensorAlertRepository.find({
        order: { timestamp: 'DESC' },
        take: limit,
      });

      this.logger.log(`🚨 Retrieved ${alerts.length} alerts from NEON DATABASE`);
      return alerts;
    } catch (error) {
      this.logger.error(`❌ Error getting alerts from database: ${error.message}`);
      return [];
    }
  }

  async getStats(): Promise<any> {
    try {
      const totalReadings = await this.sensorReadingRepository.count();
      const totalAlerts = await this.sensorAlertRepository.count();
      
      const avgResult = await this.sensorReadingRepository
        .createQueryBuilder('reading')
        .select('AVG(reading.distance)', 'avg')
        .getRawOne();
      
      const lastReading = await this.sensorReadingRepository.findOne({
        order: { timestamp: 'DESC' },
      });

      const activeAlerts = await this.sensorAlertRepository.count({
        where: { status: 'active' },
      });

      this.logger.log(`📈 Stats from NEON DATABASE: ${totalReadings} readings, ${totalAlerts} alerts`);

      return {
        totalReadings,
        totalAlerts,
        averageDistance: avgResult?.avg ? Math.round(parseFloat(avgResult.avg) * 100) / 100 : 0,
        lastReading,
        activeAlerts,
      };
    } catch (error) {
      this.logger.error(`❌ Error getting stats from database: ${error.message}`);
      return {
        totalReadings: 0,
        totalAlerts: 0,
        averageDistance: 0,
        lastReading: null,
        activeAlerts: 0,
      };
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await this.sensorReadingRepository.clear();
      await this.sensorAlertRepository.clear();
      
      this.logger.log('🗑️ Barcha sensor ma\'lumotlari va alertlar NEON DATABASE dan tozalandi');
    } catch (error) {
      this.logger.error(`❌ Ma'lumotlarni tozalashda xatolik: ${error.message}`);
      throw error;
    }
  }
}
