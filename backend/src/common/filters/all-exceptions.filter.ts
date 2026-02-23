import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionHandler');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception;

    // ❌ XATOLIK LOGI - Batafsil ma'lumot
    this.logger.error('═══════════════════════════════════════════════════════');
    this.logger.error('❌ XATOLIK YUZ BERDI!');
    this.logger.error('═══════════════════════════════════════════════════════');
    this.logger.error(`📍 URL: ${request.method} ${request.url}`);
    this.logger.error(`🕐 Vaqt: ${new Date().toLocaleString('uz-UZ')}`);
    this.logger.error(`🔢 Status: ${status}`);
    this.logger.error(`💬 Xabar: ${JSON.stringify(message, null, 2)}`);
    
    if (exception instanceof Error) {
      this.logger.error(`📝 Stack Trace:`);
      this.logger.error(exception.stack);
    }
    
    this.logger.error('═══════════════════════════════════════════════════════');

    // Response qaytarish
    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        exception instanceof HttpException
          ? exception.message
          : 'Internal server error',
      error: message,
    };

    response.status(status).json(errorResponse);
  }
}
