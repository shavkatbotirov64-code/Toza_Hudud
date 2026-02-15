import { Controller, Get, Post, Put, Body, Param, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RoutesService } from './routes.service';

@ApiTags('routes')
@Controller('routes')
export class RoutesController {
  private readonly logger = new Logger(RoutesController.name);

  constructor(private readonly routesService: RoutesService) {}

  @Post('optimize')
  @ApiOperation({ summary: 'Bir nechta qutini eng qisqa yo\'l bilan tozalash marshruti' })
  @ApiResponse({ status: 200, description: 'Optimal marshrut yaratildi' })
  async optimizeRoute(@Body() data: {
    vehicleId: string;
    startLat: number;
    startLon: number;
    bins: Array<{ binId: string; lat: number; lon: number }>;
  }) {
    try {
      this.logger.log(`🚛 Marshrut optimallashtirish so'rovi: ${data.bins.length} ta quti`);
      const result = await this.routesService.optimizeRoute(data);
      return result;
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Get('calculate')
  @ApiOperation({ summary: 'Ikki nuqta orasidagi marshrut' })
  @ApiResponse({ status: 200, description: 'Marshrut hisoblandi' })
  async calculateRoute(
    @Query('startLat') startLat: string,
    @Query('startLon') startLon: string,
    @Query('endLat') endLat: string,
    @Query('endLon') endLon: string,
  ) {
    try {
      const result = await this.routesService.calculateRoute({
        startLat: parseFloat(startLat),
        startLon: parseFloat(startLon),
        endLat: parseFloat(endLat),
        endLon: parseFloat(endLon),
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

  @Get('history/:vehicleId')
  @ApiOperation({ summary: 'Mashina marshrut tarixi' })
  @ApiResponse({ status: 200, description: 'Marshrut tarixi' })
  async getRouteHistory(
    @Param('vehicleId') vehicleId: string,
    @Query('limit') limit: string = '20',
  ) {
    try {
      const routes = await this.routesService.getRouteHistory(vehicleId, parseInt(limit));
      return {
        success: true,
        data: routes
      };
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  @Get(':routeId')
  @ApiOperation({ summary: 'Marshrut ma\'lumotini olish' })
  @ApiResponse({ status: 200, description: 'Marshrut ma\'lumoti' })
  async getRoute(@Param('routeId') routeId: string) {
    try {
      const result = await this.routesService.getRoute(routeId);
      return result;
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Put(':routeId/status')
  @ApiOperation({ summary: 'Marshrut holatini yangilash' })
  @ApiResponse({ status: 200, description: 'Marshrut holati yangilandi' })
  async updateRouteStatus(
    @Param('routeId') routeId: string,
    @Body() data: { status: string },
  ) {
    try {
      const result = await this.routesService.updateRouteStatus(routeId, data.status);
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
