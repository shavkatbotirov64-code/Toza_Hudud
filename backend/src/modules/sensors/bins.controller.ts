import { Controller, Get, Post, Put, Body, Param, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BinsService } from './bins.service';

@ApiTags('bins')
@Controller('bins')
export class BinsController {
  private readonly logger = new Logger(BinsController.name);

  constructor(private readonly binsService: BinsService) {}

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
