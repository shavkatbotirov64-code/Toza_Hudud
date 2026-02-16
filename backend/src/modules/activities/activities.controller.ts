import { Controller, Get, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';

@ApiTags('activities')
@Controller('activities')
export class ActivitiesController {
  private readonly logger = new Logger(ActivitiesController.name);

  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Oxirgi faoliyatlarni olish' })
  @ApiResponse({ status: 200, description: 'Faoliyatlar ro\'yxati' })
  async getActivities(@Query('limit') limit?: string) {
    try {
      const limitNum = limit ? parseInt(limit) : 50;
      const activities = await this.activitiesService.getRecentActivities(limitNum);
      return {
        success: true,
        data: activities,
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
