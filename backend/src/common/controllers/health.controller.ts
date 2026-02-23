import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthCheckService } from '../services/health-check.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  @Get()
  @ApiOperation({ summary: 'Tizim holati' })
  async getHealth() {
    return {
      success: true,
      status: 'OK',
      timestamp: new Date().toISOString(),
      message: 'Backend ishlayapti',
    };
  }

  @Get('issues')
  @ApiOperation({ summary: 'Barcha muammolar va xatoliklar' })
  async getAllIssues() {
    return await this.healthCheckService.getAllIssues();
  }

  @Get('errors')
  @ApiOperation({ summary: 'Faqat xatoliklar' })
  async getErrors() {
    const issues = await this.healthCheckService.getAllIssues();
    return {
      success: true,
      totalErrors: issues.statistics.totalErrors,
      errors: issues.allErrors,
    };
  }

  @Get('warnings')
  @ApiOperation({ summary: 'Faqat ogohlantirishlar' })
  async getWarnings() {
    const issues = await this.healthCheckService.getAllIssues();
    return {
      success: true,
      totalWarnings: issues.statistics.totalWarnings,
      warnings: issues.allWarnings,
    };
  }
}
