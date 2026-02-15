import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface SensorReading {
  id: string;
  distance: number;
  binId: string;
  location: string;
  timestamp: string;
  isAlert: boolean;
}

export interface SensorAlert {
  id: string;
  distance: number;
  binId: string;
  location: string;
  message: string;
  timestamp: string;
  status: 'active' | 'resolved';
}

@Injectable()
export class SensorsService {
  private readonly logger = new Logger(SensorsService.name);
  private readonly dataFilePath = path.join(process.cwd(), 'sensor-data.json');
  private readonly alertsFilePath = path.join(process.cwd(), 'sensor-alerts.json');

  constructor() {
    this.initializeFiles();
  }

  private initializeFiles() {
    try {
      if (!fs.existsSync(this.dataFilePath)) {
        fs.writeFileSync(this.dataFilePath, JSON.stringify([], null, 2));
        this.logger.log('✅ Sensor data file initialized');
      }
      
      if (!fs.existsSync(this.alertsFilePath)) {
        fs.writeFileSync(this.alertsFilePath, JSON.stringify([], null, 2));
        this.logger.log('✅ Sensor alerts file initialized');
      }
    } catch (error) {
      this.logger.error(`❌ Error initializing sensor files: ${error.message}`);
    }
  }

  private readData(): SensorReading[] {
    try {
      const data = fs.readFileSync(this.dataFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      this.logger.error(`❌ Error reading sensor data: ${error.message}`);
      return [];
    }
  }

  private saveData(data: SensorReading[]) {
    try {
      // Faqat oxirgi 1000 ta o'lchashni saqlash
      const dataToSave = data.slice(-1000);
      fs.writeFileSync(this.dataFilePath, JSON.stringify(dataToSave, null, 2));
    } catch (error) {
      this.logger.error(`❌ Error saving sensor data: ${error.message}`);
    }
  }

  private readAlerts(): SensorAlert[] {
    try {
      const data = fs.readFileSync(this.alertsFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      this.logger.error(`❌ Error reading sensor alerts: ${error.message}`);
      return [];
    }
  }

  private saveAlerts(alerts: SensorAlert[]) {
    try {
      // Faqat oxirgi 500 ta alertni saqlash
      const alertsToSave = alerts.slice(-500);
      fs.writeFileSync(this.alertsFilePath, JSON.stringify(alertsToSave, null, 2));
    } catch (error) {
      this.logger.error(`❌ Error saving sensor alerts: ${error.message}`);
    }
  }

  async saveSensorData(sensorData: any): Promise<SensorReading> {
    try {
      const readings = this.readData();
      
      const newReading: SensorReading = {
        id: `sensor-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        distance: sensorData.distance,
        binId: sensorData.binId || 'ESP32-001',
        location: sensorData.location || 'Sensor Location',
        timestamp: new Date().toISOString(),
        isAlert: sensorData.distance <= 20
      };

      readings.push(newReading);
      this.saveData(readings);

      this.logger.log(`✅ Sensor data saved: ${newReading.distance} sm`);
      return newReading;
    } catch (error) {
      this.logger.error(`❌ Error saving sensor data: ${error.message}`);
      throw error;
    }
  }

  async createAlert(sensorData: any): Promise<SensorAlert> {
    try {
      const alerts = this.readAlerts();
      
      const newAlert: SensorAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        distance: sensorData.distance,
        binId: sensorData.binId || 'ESP32-001',
        location: sensorData.location || 'Sensor Location',
        message: `⚠️ ALERT! Chiqindi quti to'la! Masofa: ${sensorData.distance} sm`,
        timestamp: new Date().toISOString(),
        status: 'active'
      };

      alerts.push(newAlert);
      this.saveAlerts(alerts);

      this.logger.warn(`🚨 Alert created: ${newAlert.message}`);
      return newAlert;
    } catch (error) {
      this.logger.error(`❌ Error creating alert: ${error.message}`);
      throw error;
    }
  }

  async getLatestData(limit: number = 10): Promise<SensorReading[]> {
    try {
      const readings = this.readData();
      return readings
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      this.logger.error(`❌ Error getting latest data: ${error.message}`);
      return [];
    }
  }

  async getAlerts(limit: number = 20): Promise<SensorAlert[]> {
    try {
      const alerts = this.readAlerts();
      return alerts
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      this.logger.error(`❌ Error getting alerts: ${error.message}`);
      return [];
    }
  }

  async getStats(): Promise<any> {
    try {
      const readings = this.readData();
      const alerts = this.readAlerts();
      
      const totalReadings = readings.length;
      const totalAlerts = alerts.length;
      const averageDistance = totalReadings > 0 
        ? readings.reduce((sum, r) => sum + r.distance, 0) / totalReadings 
        : 0;
      const lastReading = readings.length > 0 
        ? readings[readings.length - 1] 
        : null;

      return {
        totalReadings,
        totalAlerts,
        averageDistance: Math.round(averageDistance * 100) / 100,
        lastReading,
        activeAlerts: alerts.filter(a => a.status === 'active').length
      };
    } catch (error) {
      this.logger.error(`❌ Error getting stats: ${error.message}`);
      return {
        totalReadings: 0,
        totalAlerts: 0,
        averageDistance: 0,
        lastReading: null,
        activeAlerts: 0
      };
    }
  }

  async clearAllData(): Promise<void> {
    try {
      // Barcha sensor ma'lumotlarini tozalash
      fs.writeFileSync(this.dataFilePath, JSON.stringify([], null, 2));
      
      // Barcha alertlarni tozalash
      fs.writeFileSync(this.alertsFilePath, JSON.stringify([], null, 2));
      
      this.logger.log('🗑️ Barcha sensor ma\'lumotlari va alertlar tozalandi');
    } catch (error) {
      this.logger.error(`❌ Ma'lumotlarni tozalashda xatolik: ${error.message}`);
      throw error;
    }
  }
}
