import { Controller, Get, Post, Body, Param, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CleaningsService } from './cleanings.service';

@ApiTags('cleanings')
@Controller('cleanings')
export class CleaningsController {
  private readonly logger = new Logger(CleaningsController.name);

  constructor(private readonly cleaningsService: CleaningsService) {}

  @Post('create')
  @ApiOperation({ summary: 'Tozalash yozuvi yaratish' })
  @ApiResponse({ status: 200, description: 'Tozalash yozuvi yaratildi' })
  async createCleaning(@Body() data: {
    binId: string;
    vehicleId: string;
    driverName: string;
    binLocation: string;
    fillLevelBefore?: number;
    fillLevelAfter?: number;
    distanceTraveled?: number;
    durationMinutes?: number;
    notes?: string;
    status?: string;
  }) {
    try {
      const cleaning = await this.cleaningsService.createCleaning(data);
      return {
        success: true,
        data: cleaning,
      };
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('history')
  @ApiOperation({ summary: 'Barcha tozalashlar tarixi' })
  @ApiResponse({ status: 200, description: 'Tozalashlar ro\'yxati' })
  async getCleaningHistory(@Query('limit') limit: string = '50') {
    try {
      const cleanings = await this.cleaningsService.getCleaningHistory(parseInt(limit));
      return {
        success: true,
        data: cleanings,
      };
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  @Get('by-bin/:binId')
  @ApiOperation({ summary: 'Quti bo\'yicha tozalashlar' })
  @ApiResponse({ status: 200, description: 'Quti tozalashlari' })
  async getCleaningsByBin(
    @Param('binId') binId: string,
    @Query('limit') limit: string = '20',
  ) {
    try {
      const cleanings = await this.cleaningsService.getCleaningsByBin(binId, parseInt(limit));
      return {
        success: true,
        data: cleanings,
      };
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  @Get('by-vehicle/:vehicleId')
  @ApiOperation({ summary: 'Mashina bo\'yicha tozalashlar' })
  @ApiResponse({ status: 200, description: 'Mashina tozalashlari' })
  async getCleaningsByVehicle(
    @Param('vehicleId') vehicleId: string,
    @Query('limit') limit: string = '20',
  ) {
    try {
      const cleanings = await this.cleaningsService.getCleaningsByVehicle(vehicleId, parseInt(limit));
      return {
        success: true,
        data: cleanings,
      };
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Tozalash statistikasi' })
  @ApiResponse({ status: 200, description: 'Statistika ma\'lumotlari' })
  async getCleaningStats() {
    try {
      const stats = await this.cleaningsService.getCleaningStats();
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: {},
      };
    }
  }

  @Get('daily')
  @ApiOperation({ summary: 'Kunlik tozalashlar (oxirgi 7 kun)' })
  @ApiResponse({ status: 200, description: 'Kunlik statistika' })
  async getDailyCleanings() {
    try {
      const daily = await this.cleaningsService.getDailyCleanings();
      return {
        success: true,
        data: daily,
      };
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }
}
