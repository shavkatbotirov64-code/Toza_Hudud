import { Body, Controller, Get, Logger, Post, Query } from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DispatchService } from './modules/sensors/dispatch.service';

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

  constructor(private readonly dispatchService: DispatchService) {}

  private normalizePayload(payload: any): SensorData {
    const source = typeof payload === 'string' ? JSON.parse(payload) : (payload || {});

    const rawDistance =
      source.distance ??
      source.distanceCm ??
      source.distance_cm ??
      source.cm ??
      source.value;

    const distance = Number(rawDistance);
    if (!Number.isFinite(distance)) {
      throw new Error('Invalid sensor distance value');
    }

    return {
      distance,
      binId: source.binId || source.sensorId || source.sensor_id || source.bin || 'ESP32-IBN-SINO',
      location: source.location || source.locationName || source.address || "Ibn Sino ko'chasi 17A, Samarqand",
      timestamp: source.timestamp || source.time || source.ts,
    };
  }

  private async handleDistanceInternal(payload: any) {
    const normalized = this.normalizePayload(payload);
    this.logger.log(`ESP32 data received: ${JSON.stringify(normalized)}`);
    return await this.dispatchService.handleSensorDistance(normalized);
  }

  // Dedicated ESP32 endpoint; /sensors/distance remains available in SensorsController.
  @Post('esp32/distance')
  @ApiOperation({ summary: "ESP32 dan masofa ma'lumotini qabul qilish" })
  @ApiResponse({ status: 200, description: "Ma'lumot muvaffaqiyatli qabul qilindi" })
  async receiveDistance(@Body() data: SensorData) {
    try {
      return await this.handleDistanceInternal(data);
    } catch (error) {
      this.logger.error(`ESP32 distance processing failed: ${error.message}`);
      console.error('[ESP32Controller] receiveDistance error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // GET fallback for firmware that sends query params instead of JSON body
  @Get('esp32/distance')
  async receiveDistanceGet(@Query() query: any) {
    try {
      return await this.handleDistanceInternal(query);
    } catch (error) {
      this.logger.error(`ESP32 GET distance processing failed: ${error.message}`);
      console.error('[ESP32Controller] receiveDistanceGet error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Backward compatibility for old firmware using /api prefix
  @Post('api/esp32/distance')
  async receiveDistanceApi(@Body() data: any) {
    return this.receiveDistance(data);
  }

  @Get('api/esp32/distance')
  async receiveDistanceApiGet(@Query() query: any) {
    return this.receiveDistanceGet(query);
  }

  @Post('api/sensors/distance')
  async receiveSensorsApi(@Body() data: any) {
    return this.receiveDistance(data);
  }

  @Get('api/sensors/distance')
  async receiveSensorsApiGet(@Query() query: any) {
    return this.receiveDistanceGet(query);
  }

  @Post('data')
  @ApiOperation({ summary: "ESP32 dan ixtiyoriy ma'lumot qabul qilish" })
  @ApiResponse({ status: 200, description: "Ma'lumot qabul qilindi" })
  async receiveData(@Body() data: any) {
    this.logger.log(`ESP32 raw payload: ${JSON.stringify(data)}`);
    return {
      success: true,
      message: 'Raw data accepted',
      receivedData: data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('api/data')
  async receiveDataApi(@Body() data: any) {
    return this.receiveData(data);
  }
}
