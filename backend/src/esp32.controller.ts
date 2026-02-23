import { Body, Controller, Logger, Post } from '@nestjs/common';
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

  // Dedicated ESP32 endpoint; /sensors/distance remains available in SensorsController.
  @Post('esp32/distance')
  @ApiOperation({ summary: "ESP32 dan masofa ma'lumotini qabul qilish" })
  @ApiResponse({ status: 200, description: "Ma'lumot muvaffaqiyatli qabul qilindi" })
  async receiveDistance(@Body() data: SensorData) {
    try {
      this.logger.log(`ESP32 data received: ${JSON.stringify(data)}`);
      return await this.dispatchService.handleSensorDistance(data);
    } catch (error) {
      this.logger.error(`ESP32 distance processing failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
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
}
