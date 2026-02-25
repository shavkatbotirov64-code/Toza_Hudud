import { Body, Controller, Delete, Get, Logger, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DispatchService } from './dispatch.service';
import { SensorsService } from './sensors.service';

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
    private readonly dispatchService: DispatchService,
  ) {}

  @Post('distance')
  @ApiOperation({ summary: "ESP32 dan masofa ma'lumotini qabul qilish" })
  @ApiResponse({ status: 200, description: "Ma'lumot muvaffaqiyatli saqlandi" })
  async receiveDistance(@Body() data: SensorData) {
    try {
      this.logger.log(`Sensor distance payload: ${JSON.stringify(data)}`);
      return await this.dispatchService.handleSensorDistance(data);
    } catch (error) {
      this.logger.error(`Sensor distance processing failed: ${error.message}`);
      console.error('[SensorsController] receiveDistance error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // GET fallback for simple firmware clients sending query params
  @Get('distance')
  async receiveDistanceGet(@Query() query: any) {
    try {
      const payload: SensorData = {
        distance: Number(query?.distance ?? query?.distanceCm ?? query?.distance_cm ?? query?.cm),
        binId: query?.binId || query?.sensorId || query?.sensor_id,
        location: query?.location || query?.locationName || query?.address,
        timestamp: query?.timestamp || query?.time || query?.ts,
      };
      this.logger.log(`Sensor distance query payload: ${JSON.stringify(payload)}`);
      return await this.dispatchService.handleSensorDistance(payload);
    } catch (error) {
      this.logger.error(`Sensor distance GET processing failed: ${error.message}`);
      console.error('[SensorsController] receiveDistanceGet error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('latest')
  @ApiOperation({ summary: "Oxirgi sensor ma'lumotlarini olish" })
  @ApiResponse({ status: 200, description: "Oxirgi ma'lumotlar" })
  async getLatestData(@Query('limit') limit: string = '10') {
    try {
      const data = await this.sensorsService.getLatestData(parseInt(limit, 10));
      return {
        success: true,
        data,
      };
    } catch (error) {
      this.logger.error(`Latest sensor data fetch failed: ${error.message}`);
      console.error('[SensorsController] getLatestData error:', error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Sensor alertlarini olish' })
  @ApiResponse({ status: 200, description: "Alert ma'lumotlari" })
  async getAlerts(@Query('limit') limit: string = '20') {
    try {
      const alerts = await this.sensorsService.getAlerts(parseInt(limit, 10));
      return {
        success: true,
        data: alerts,
      };
    } catch (error) {
      this.logger.error(`Alerts fetch failed: ${error.message}`);
      console.error('[SensorsController] getAlerts error:', error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Sensor statistikalari' })
  @ApiResponse({ status: 200, description: "Statistika ma'lumotlari" })
  async getStats() {
    try {
      const stats = await this.sensorsService.getStats();
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      this.logger.error(`Sensor stats fetch failed: ${error.message}`);
      console.error('[SensorsController] getStats error:', error);
      return {
        success: false,
        error: error.message,
        data: {
          totalReadings: 0,
          totalAlerts: 0,
          averageDistance: 0,
          lastReading: null,
          activeAlerts: 0,
        },
      };
    }
  }

  @Delete('clear')
  @ApiOperation({ summary: "Barcha sensor ma'lumotlarini tozalash" })
  @ApiResponse({ status: 200, description: "Ma'lumotlar tozalandi" })
  async clearAllData() {
    try {
      await this.sensorsService.clearAllData();
      return {
        success: true,
        message: "Barcha sensor ma'lumotlari tozalandi",
      };
    } catch (error) {
      this.logger.error(`Sensor clear failed: ${error.message}`);
      console.error('[SensorsController] clearAllData error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
