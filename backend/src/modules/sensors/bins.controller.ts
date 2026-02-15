import { Controller, Get, Post, Put, Body, Param, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BinsService } from './bins.service';

@ApiTags('bins')
@Controller('bins')
export class BinsController {
  private readonly logger = new Logger(BinsController.name);

  constructor(private readonly binsService: BinsService) {}

  @Get()
  @ApiOperation({ summary: 'Barcha qutilar' })
  @ApiResponse({ status: 200, description: 'Qutilar ro\'yxati' })
  async getAllBinsDefault() {
    try {
      const bins = await this.binsService.getAllBins();
      this.logger.log(`📦 Retrieved ${bins.length} bins from database`);
      
      // Frontend formatiga o'zgartirish
      const formattedBins = bins.map(bin => ({
        id: bin.id,
        code: bin.binId, // Frontend code kutadi
        binId: bin.binId,
        address: bin.location, // Frontend address kutadi
        location: bin.location,
        district: bin.district || 'Samarqand',
        latitude: bin.latitude,
        longitude: bin.longitude,
        status: bin.status,
        fillLevel: bin.fillLevel,
        capacity: bin.capacity,
        type: bin.type || 'standard',
        sensorId: bin.sensorId || bin.binId,
        isOnline: bin.isOnline !== undefined ? bin.isOnline : true,
        batteryLevel: bin.batteryLevel || 100,
        lastDistance: bin.lastDistance,
        lastCleaned: bin.lastCleaningTime,
        lastUpdate: bin.updatedAt,
        totalCleanings: bin.totalCleanings,
        isActive: bin.isActive,
        createdAt: bin.createdAt,
        updatedAt: bin.updatedAt,
      }));
      
      return {
        success: true,
        message: 'Bins retrieved successfully',
        data: formattedBins,
        pagination: {
          total: formattedBins.length,
          page: 1,
          limit: formattedBins.length,
        },
        timestamp: new Date().toISOString(),
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

  @Post('create')
  @ApiOperation({ summary: 'Yangi quti yaratish' })
  @ApiResponse({ status: 200, description: 'Quti yaratildi' })
  async createBin(@Body() data: {
    binId: string;
    location: string;
    latitude: number;
    longitude: number;
    capacity?: number;
  }) {
    try {
      const bin = await this.binsService.upsertBin(data);
      return {
        success: true,
        data: bin,
      };
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get(':binId/status')
  @ApiOperation({ summary: 'Quti holatini olish' })
  @ApiResponse({ status: 200, description: 'Quti holati' })
  async getBinStatus(@Param('binId') binId: string) {
    try {
      const bin = await this.binsService.getBinStatus(binId);
      return {
        success: true,
        data: bin,
      };
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('list')
  @ApiOperation({ summary: 'Barcha qutilar' })
  @ApiResponse({ status: 200, description: 'Qutilar ro\'yxati' })
  async getAllBins() {
    try {
      const bins = await this.binsService.getAllBins();
      return {
        success: true,
        data: bins,
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

  @Get('full')
  @ApiOperation({ summary: 'To\'la qutilar ro\'yxati' })
  @ApiResponse({ status: 200, description: 'To\'la qutilar' })
  async getFullBins() {
    try {
      const bins = await this.binsService.getFullBins();
      return {
        success: true,
        data: bins,
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

  @Put(':binId/status')
  @ApiOperation({ summary: 'Quti holatini o\'zgartirish' })
  @ApiResponse({ status: 200, description: 'Holat o\'zgartirildi' })
  async updateBinStatus(
    @Param('binId') binId: string,
    @Body() data: {
      status: 'FULL' | 'EMPTY';
      fillLevel?: number;
      distance?: number;
    },
  ) {
    try {
      const bin = await this.binsService.updateBinStatus(
        binId,
        data.status,
        data.fillLevel,
        data.distance,
      );
      return {
        success: true,
        data: bin,
      };
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Put(':binId/clean')
  @ApiOperation({ summary: 'Qutini tozalash' })
  @ApiResponse({ status: 200, description: 'Quti tozalandi' })
  async cleanBin(@Param('binId') binId: string) {
    try {
      const bin = await this.binsService.cleanBin(binId);
      return {
        success: true,
        data: bin,
      };
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
