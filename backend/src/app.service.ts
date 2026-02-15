import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getHealth() {
    return {
      success: true,
      message: 'Smart Trash System API is running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  getStatus() {
    const uptime = process.uptime();
    const memory = process.memoryUsage();
    const environment = this.configService.get('NODE_ENV', 'development');

    return {
      success: true,
      message: 'System status retrieved',
      data: {
        uptime: Math.floor(uptime),
        memory: {
          rss: `${Math.round(memory.rss / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`,
          external: `${Math.round(memory.external / 1024 / 1024)} MB`,
        },
        database: 'connected', // This would be checked in real implementation
        environment,
        nodeVersion: process.version,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
