import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeController } from '@nestjs/swagger';
import { SensorsService } from './modules/sensors/sensors.service';
import { SensorsGateway } from './modules/sensors/sensors.gateway';
import { BinsService } from './modules/sensors/bins.service';

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

  constructor(
    private readonly sensorsService: SensorsService,
    private readonly sensorsGateway: SensorsGateway,
    private readonly binsService: BinsService,
  ) { }

  @Post('sensors/distance')
  @ApiOperation({ summary: 'ESP32 dan masofa ma\'lumotini qabul qilish' })
  @ApiResponse({ status: 200, description: 'Ma\'lumot muvaffaqiyatli qabul qilindi' })
  async receiveDistance(@Body() data: SensorData) {
    try {
      this.logger.log(`📡 ESP32 dan ma'lumot keldi: ${JSON.stringify(data)}`);
      this.logger.log(`📊 Masofa: ${data.distance} sm | Quti: ${data.binId || 'unknown'} | Joylashuv: ${data.location || 'unknown'}`);

      // Ma'lumotni saqlash
      const savedData = await this.sensorsService.saveSensorData(data);
      this.logger.log(`💾 Database ga saqlandi: ${JSON.stringify(savedData)}`);

      // 🔥 WebSocket orqali barcha clientlarga yuborish
      this.logger.log(`📤 WebSocket emit qilinmoqda: sensorData`);
      this.sensorsGateway.emitNewSensorData(savedData);
      this.logger.log(`✅ WebSocket: Ma'lumot barcha clientlarga yuborildi`);

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
            location: data.location || 'Ibn Sino ko\'chasi 17A, Samarqand',
            latitude: 39.6270, // Ibn Sino ko'chasi
            longitude: 66.9748,
            capacity: 120,
          });
          await this.binsService.markBinAsFull(binId, data.distance);
        }
        
        // 🔥 Quti FULL holatini yuborish
        this.logger.log(`📤 WebSocket emit qilinmoqda: binStatus (${binId} = FULL)`);
        this.sensorsGateway.emitBinStatusChange(binId, 'FULL');
        this.logger.log(`✅ WebSocket: binStatus yuborildi`);
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
      this.logger.error(`❌ Stack trace: ${error.stack}`);
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