import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'API is running',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Smart Trash System API is running' },
        version: { type: 'string', example: '1.0.0' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
      },
    },
  })
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint (alternative)' })
  @ApiResponse({
    status: 200,
    description: 'API health status',
  })
  getHealthCheck() {
    return this.appService.getHealth();
  }

  @Get('status')
  @ApiOperation({ summary: 'System status endpoint' })
  @ApiResponse({
    status: 200,
    description: 'System status information',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'System status retrieved' },
        data: {
          type: 'object',
          properties: {
            uptime: { type: 'number', example: 3600 },
            memory: { type: 'object' },
            database: { type: 'string', example: 'connected' },
            environment: { type: 'string', example: 'development' },
          },
        },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
      },
    },
  })
  getStatus() {
    return this.appService.getStatus();
  }
}
