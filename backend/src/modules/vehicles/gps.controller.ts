import { Controller, Get, Post, Body, Param, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GpsService } from './gps.service';

@ApiTags('gps')
@Controller('vehicles')
export class GpsController {
  private readonly logger = new Logger(GpsController.name);

  constructor(private readonly gpsService: GpsService) {}

  @Post(':vehicleId/gps')
  @ApiOperation({ summary: 'GPS koordinatalarini saqlash' })
  @ApiResponse({ status: 200, description: 'GPS ma\'lumot saqlandi' })
  async saveGpsLocation(
    @Param('vehicleId') vehicleId: string,
    @Body() data: {
      latitude: number;
      longitude: number;
      speed?: number;
      heading?: number;
      altitude?: number;
      accuracy?: number;
      timestamp?: string;
    }
  ) {
    try {
      const result = await this.gpsService.saveGpsLocation({
        vehicleId,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed,
        heading: data.heading,
        altitude: data.altitude,
        accuracy: data.accuracy,
        timestamp: data.timestamp ? new Date(data.timestamp) : undefined
      });
      return result;
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Get(':vehicleId/gps/current')
  @ApiOperation({ summary: 'Hozirgi GPS pozitsiyasini olish' })
  @ApiResponse({ status: 200, description: 'Hozirgi pozitsiya' })
  async getCurrentLocation(@Param('vehicleId') vehicleId: string) {
    try {
      const result = await this.gpsService.getCurrentLocation(vehicleId);
      return result;
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Get(':vehicleId/gps-history')
  @ApiOperation({ summary: 'GPS tarixi (oxirgi N soat)' })
  @ApiResponse({ status: 200, description: 'GPS tarixi' })
  async getGpsHistory(
    @Param('vehicleId') vehicleId: string,
    @Query('hours') hours: string = '1'
  ) {
    try {
      const result = await this.gpsService.getGpsHistory(vehicleId, parseInt(hours));
      return result;
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  @Get(':vehicleId/track')
  @ApiOperation({ summary: 'Mashina harakatini kuzatish (real-time tracking)' })
  @ApiResponse({ status: 200, description: 'Tracking ma\'lumotlari' })
  async trackVehicle(
    @Param('vehicleId') vehicleId: string,
    @Query('limit') limit: string = '50'
  ) {
    try {
      const result = await this.gpsService.trackVehicle(vehicleId, parseInt(limit));
      return result;
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Post('gps/cleanup')
  @ApiOperation({ summary: 'Eski GPS ma\'lumotlarini tozalash (30 kundan eski)' })
  @ApiResponse({ status: 200, description: 'Tozalash natijasi' })
  async cleanOldGpsData() {
    try {
      const result = await this.gpsService.cleanOldGpsData();
      return result;
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
