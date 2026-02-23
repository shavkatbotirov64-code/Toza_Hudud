import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const now = Date.now();

    // ✅ REQUEST LOGI
    this.logger.log('───────────────────────────────────────────────────────');
    this.logger.log(`📥 REQUEST: ${method} ${url}`);
    this.logger.log(`🕐 Vaqt: ${new Date().toLocaleString('uz-UZ')}`);
    
    if (Object.keys(query).length > 0) {
      this.logger.log(`🔍 Query: ${JSON.stringify(query)}`);
    }
    
    if (Object.keys(params).length > 0) {
      this.logger.log(`📌 Params: ${JSON.stringify(params)}`);
    }
    
    if (Object.keys(body).length > 0) {
      this.logger.log(`📦 Body: ${JSON.stringify(body, null, 2)}`);
    }

    return next.handle().pipe(
      tap((data) => {
        const responseTime = Date.now() - now;
        
        // ✅ RESPONSE LOGI
        this.logger.log(`📤 RESPONSE: ${method} ${url}`);
        this.logger.log(`⏱️ Vaqt: ${responseTime}ms`);
        this.logger.log(`✅ Status: SUCCESS`);
        
        if (data && typeof data === 'object') {
          const dataPreview = JSON.stringify(data).substring(0, 200);
          this.logger.log(`📊 Data: ${dataPreview}${JSON.stringify(data).length > 200 ? '...' : ''}`);
        }
        
        this.logger.log('───────────────────────────────────────────────────────');
      }),
      catchError((error) => {
        const responseTime = Date.now() - now;
        
        // ❌ ERROR LOGI
        this.logger.error('═══════════════════════════════════════════════════════');
        this.logger.error(`❌ ERROR: ${method} ${url}`);
        this.logger.error(`⏱️ Vaqt: ${responseTime}ms`);
        this.logger.error(`💥 Xatolik: ${error.message}`);
        this.logger.error('═══════════════════════════════════════════════════════');
        
        return throwError(() => error);
      }),
    );
  }
}
