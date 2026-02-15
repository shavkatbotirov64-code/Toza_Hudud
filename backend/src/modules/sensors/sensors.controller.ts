import { Controller, Post, Get, Delete, Body, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SensorsService } from './sensors.service';
import { SensorsGateway } from './sensors.gateway';
import { BinsService } from './bins.service';

export interface SensorData {
  distance: number;
  binId?: string;
  location?: string;
  timestamp?: string;
}

@ApiTags('sensors')
@Controller('sensors')
export class SensorsController {
  private readonly logger = new Logger(SensorsController.name);

  constructor(
    private readonly sensorsService: SensorsService,
    private readonly sensorsGateway: SensorsGateway,
    private readonly binsService: BinsService,
  ) {}

  // ESP32 uchun root level endpoint (prefiksiz)
  @Post('distance')
  @ApiOperation({ summary: 'ESP32 dan masofa ma\'lumotini qabul qilish' })
  @ApiResponse({ status: 200, description: 'Ma\'lumot muvaffaqiyatli saqlandi' })
  async receiveDistance(@Body() data: SensorData) {
    try {
      this.logger.log(`📡 ESP32 dan ma'lumot keldi: ${JSON.stringify(data)}`);
      
      // Ma'lumotni saqlash
      const savedData = await this.sensorsService.saveSensorData(data);
      
      // 🔥 WebSocket orqali barcha clientlarga yuborish
      this.sensorsGateway.emitNewSensorData(savedData);
      this.logger.log(`📤 WebSocket: Ma'lumot barcha clientlarga yuborildi`);
      
      // Agar 20 sm dan kam bo'lsa, alert yaratish va qutini FULL qilish
      if (data.distance <= 20) {
        this.logger.warn(`🚨 ALERT: Chiqindi quti to'la! Masofa: ${data.distance} sm`);
        await this.sensorsService.createAlert(data);
        
        // 🔥 Qutini FULL holatiga o'tkazish
        const binId = data.binId || 'ESP32-IBN-SINO';
        try {
          await this.binsService.markBinAsFull(binId, data.distance);
          this.logger.log(`🗑️ Bin marked as FULL in database: ${binId}`);
        } catch (binError) {
          // Agar quti topilmasa, yaratish
          this.logger.warn(`⚠️ Bin not found, creating: ${binId}`);
          await this.binsService.upsertBin({
            binId: binId,
            location: data.location || 'Samarqand',
            latitude: 39.6542,
            longitude: 66.9597,
            capacity: 120,
          });
          await this.binsService.markBinAsFull(binId, data.distance);
        }
        
        // 🔥 Quti FULL holatini yuborish
        this.sensorsGateway.emitBinStatusChange(binId, 'FULL');
      }

      return {
        success: true,
        message: 'Ma\'lumot saqlandi',
        data: savedData
      };
    } catch (error) {
      this.logger.error(`❌ Sensor ma'lumotini saqlashda xatolik: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Get('latest')
  @ApiOperation({ summary: 'Oxirgi sensor ma\'lumotlarini olish' })
  @ApiResponse({ status: 200, description: 'Oxirgi ma\'lumotlar' })
  async getLatestData(@Query('limit') limit: string = '10') {
    try {
      const data = await this.sensorsService.getLatestData(parseInt(limit));
      return {
        success: true,
        data
      };
    } catch (error) {
      this.logger.error(`❌ Sensor ma'lumotlarini olishda xatolik: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Sensor alertlarini olish' })
  @ApiResponse({ status: 200, description: 'Alert ma\'lumotlari' })
  async getAlerts(@Query('limit') limit: string = '20') {
    try {
      const alerts = await this.sensorsService.getAlerts(parseInt(limit));
      return {
        success: true,
        data: alerts
      };
    } catch (error) {
      this.logger.error(`❌ Alertlarni olishda xatolik: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Sensor statistikalari' })
  @ApiResponse({ status: 200, description: 'Statistika ma\'lumotlari' })
  async getStats() {
    try {
      const stats = await this.sensorsService.getStats();
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      this.logger.error(`❌ Statistikani olishda xatolik: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: {
          totalReadings: 0,
          totalAlerts: 0,
          averageDistance: 0,
          lastReading: null
        }
      };
    }
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Barcha sensor ma\'lumotlarini tozalash' })
  @ApiResponse({ status: 200, description: 'Ma\'lumotlar tozalandi' })
  async clearAllData() {
    try {
      await this.sensorsService.clearAllData();
      this.logger.log('🗑️ Barcha sensor ma\'lumotlari tozalandi');
      return {
        success: true,
        message: 'Barcha sensor ma\'lumotlari tozalandi'
      };
    } catch (error) {
      this.logger.error(`❌ Ma'lumotlarni tozalashda xatolik: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}