import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeController } from '@nestjs/swagger';
import { SensorsService } from './modules/sensors/sensors.service';

export interface SensorData {
  distance: number;
  binId?: string;
  location?: string;
  timestamp?: string;
}

@ApiExcludeController()
@Controller()
export class ESP32Controller {
  private readonly logger = new Logger(ESP32Controller.name);

  constructor(private readonly sensorsService: SensorsService) { }

  @Post('sensors/distance')
  @ApiOperation({ summary: 'ESP32 dan masofa ma\'lumotini qabul qilish' })
  @ApiResponse({ status: 200, description: 'Ma\'lumot muvaffaqiyatli qabul qilindi' })
  async receiveDistance(@Body() data: SensorData) {
    try {
      this.logger.log(`📡 ESP32 dan ma'lumot keldi: ${JSON.stringify(data)}`);
      this.logger.log(`📊 Masofa: ${data.distance} sm | Quti: ${data.binId || 'unknown'} | Joylashuv: ${data.location || 'unknown'}`);

      // Ma'lumotni saqlash
      const savedData = await this.sensorsService.saveSensorData(data);

      // Agar 20 sm dan kam bo'lsa, alert yaratish
      if (data.distance <= 20) {
        this.logger.warn(`🚨 ALERT: Chiqindi quti to'la! Masofa: ${data.distance} sm`);
        await this.sensorsService.createAlert(data);
      }

      return {
        success: true,
        message: 'Ma\'lumot muvaffaqiyatli qabul qilindi va saqlandi',
        data: {
          ...savedData,
          status: data.distance <= 20 ? 'FULL' : 'OK'
        }
      };
    } catch (error) {
      this.logger.error(`❌ ESP32 ma'lumotini qabul qilishda xatolik: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: 'Ma\'lumot qabul qilishda xatolik yuz berdi'
      };
    }
  }

  @Post('data')
  @ApiOperation({ summary: 'ESP32 dan har qanday ma\'lumot qabul qilish' })
  @ApiResponse({ status: 200, description: 'Ma\'lumot qabul qilindi' })
  async receiveData(@Body() data: any) {
    try {
      this.logger.log(`📡 ESP32 dan raw ma'lumot: ${JSON.stringify(data)}`);

      return {
        success: true,
        message: 'Raw ma\'lumot qabul qilindi',
        receivedData: data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Raw ma'lumot qabul qilishda xatolik: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}