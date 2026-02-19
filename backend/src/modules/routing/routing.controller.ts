import { Controller, Get, Query, Logger } from '@nestjs/common';
import { RoutingService, RouteResult } from './routing.service';

@Controller('routing')
export class RoutingController {
  private readonly logger = new Logger(RoutingController.name);

  constructor(private readonly routingService: RoutingService) {}

  /**
   * GET /routing/route?startLat=39.67&startLon=66.97&endLat=39.68&endLon=66.98
   * Marshrut olish
   */
  @Get('route')
  async getRoute(
    @Query('startLat') startLat: string,
    @Query('startLon') startLon: string,
    @Query('endLat') endLat: string,
    @Query('endLon') endLon: string,
  ): Promise<{ success: boolean; data: RouteResult }> {
    this.logger.log(`📍 Route request: [${startLat}, ${startLon}] → [${endLat}, ${endLon}]`);

    const result = await this.routingService.getRoute(
      parseFloat(startLat),
      parseFloat(startLon),
      parseFloat(endLat),
      parseFloat(endLon),
    );

    return {
      success: result.success,
      data: result,
    };
  }
}
