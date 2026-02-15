import { Controller, Get, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard uchun umumiy statistika' })
  @ApiResponse({ status: 200, description: 'Dashboard statistikasi' })
  async getDashboardStats() {
    try {
      const result = await this.analyticsService.getDashboardStats();
      return result;
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('daily')
  @ApiOperation({ summary: 'Kunlik statistika' })
  @ApiResponse({ status: 200, description: 'Kunlik hisobot' })
  async getDailyStats(@Query('date') date?: string) {
    try {
      const result = await this.analyticsService.getDailyStats(date);
      return result;
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('weekly')
  @ApiOperation({ summary: 'Haftalik hisobot' })
  @ApiResponse({ status: 200, description: 'Haftalik statistika' })
  async getWeeklyStats() {
    try {
      const result = await this.analyticsService.getWeeklyStats();
      return result;
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Oylik hisobot' })
  @ApiResponse({ status: 200, description: 'Oylik statistika' })
  async getMonthlyStats(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    try {
      const result = await this.analyticsService.getMonthlyStats(
        year ? parseInt(year) : undefined,
        month ? parseInt(month) : undefined,
      );
      return result;
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('efficiency')
  @ApiOperation({ summary: 'Samaradorlik ko\'rsatkichlari' })
  @ApiResponse({ status: 200, description: 'Samaradorlik statistikasi' })
  async getEfficiencyStats() {
    try {
      const result = await this.analyticsService.getEfficiencyStats();
      return result;
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('bins')
  @ApiOperation({ summary: 'Qutilar statistikasi' })
  @ApiResponse({ status: 200, description: 'Qutilar hisoboti' })
  async getBinsStats() {
    try {
      const result = await this.analyticsService.getBinsStats();
      return result;
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('vehicles')
  @ApiOperation({ summary: 'Mashinalar statistikasi' })
  @ApiResponse({ status: 200, description: 'Mashinalar hisoboti' })
  async getVehiclesStats() {
    try {
      const result = await this.analyticsService.getVehiclesStats();
      return result;
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
