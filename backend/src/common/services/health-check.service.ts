import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../../modules/vehicles/entities/vehicle.entity';
import { Bin } from '../../modules/bins/entities/bin.entity';

@Injectable()
interface ErrorLog {
  timestamp: Date;
  message: string;
  stack?: string;
}

interface WarningLog {
  timestamp: Date;
  message: string;
}

export class HealthCheckService {
  private readonly logger = new Logger('HealthCheck');
  private startTime: Date;
  private errors: ErrorLog[] = [];
  private warnings: WarningLog[] = [];

  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Bin)
    private binRepository: Repository<Bin>,
  ) {
    this.startTime = new Date();
    this.startHealthMonitoring();
  }

  // Xatoliklarni yig'ish
  addError(message: string, stack?: string) {
    this.errors.push({
      timestamp: new Date(),
      message,
      stack,
    });
    
    // Faqat oxirgi 100 ta xatolikni saqlash
    if (this.errors.length > 100) {
      this.errors.shift();
    }
  }

  // Ogohlantirishlarni yig'ish
  addWarning(message: string) {
    this.warnings.push({
      timestamp: new Date(),
      message,
    });
    
    // Faqat oxirgi 100 ta ogohlantirishni saqlash
    if (this.warnings.length > 100) {
      this.warnings.shift();
    }
  }

  // Barcha muammolarni olish
  async getAllIssues() {
    const uptime = Date.now() - this.startTime.getTime();
    const uptimeMinutes = Math.floor(uptime / 60000);
    const uptimeHours = Math.floor(uptimeMinutes / 60);
    const uptimeDays = Math.floor(uptimeHours / 24);

    // Database holatini tekshirish
    let dbStatus = 'OK';
    let dbError = null;
    try {
      await this.vehicleRepository.count();
      await this.binRepository.count();
    } catch (error) {
      dbStatus = 'ERROR';
      dbError = error.message;
      this.addError(`Database connection error: ${error.message}`, error.stack);
    }

    // Mashinalar holatini tekshirish
    const vehicles = await this.vehicleRepository.find();
    const vehicleIssues: string[] = [];
    
    vehicles.forEach(vehicle => {
      if (!vehicle.latitude || !vehicle.longitude) {
        vehicleIssues.push(`${vehicle.vehicleId}: Pozitsiya mavjud emas`);
      }
      if (!vehicle.driver) {
        vehicleIssues.push(`${vehicle.vehicleId}: Haydovchi nomi mavjud emas`);
      }
    });

    // Qutilar holatini tekshirish
    const bins = await this.binRepository.find();
    const binIssues: string[] = [];
    
    bins.forEach(bin => {
      if (!bin.latitude || !bin.longitude) {
        binIssues.push(`${bin.binId}: Pozitsiya mavjud emas`);
      }
      if (bin.fillLevel > 90 && bin.status !== 'FULL') {
        binIssues.push(`${bin.binId}: FillLevel ${bin.fillLevel}% lekin status FULL emas`);
      }
    });

    return {
      success: true,
      timestamp: new Date().toISOString(),
      uptime: {
        milliseconds: uptime,
        minutes: uptimeMinutes,
        hours: uptimeHours,
        days: uptimeDays,
        formatted: `${uptimeDays}d ${uptimeHours % 24}h ${uptimeMinutes % 60}m`,
      },
      startTime: this.startTime.toISOString(),
      database: {
        status: dbStatus,
        error: dbError,
      },
      statistics: {
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length,
        totalVehicles: vehicles.length,
        totalBins: bins.length,
      },
      recentErrors: this.errors.slice(-10).reverse(), // Oxirgi 10 ta xatolik
      recentWarnings: this.warnings.slice(-10).reverse(), // Oxirgi 10 ta ogohlantirish
      vehicleIssues,
      binIssues,
      allErrors: this.errors.reverse(), // Barcha xatoliklar
      allWarnings: this.warnings.reverse(), // Barcha ogohlantirishlar
    };
  }

  // Har 5 daqiqada health check
  private startHealthMonitoring() {
    setInterval(async () => {
      try {
        const issues = await this.getAllIssues();
        
        if (issues.recentErrors.length > 0 || issues.vehicleIssues.length > 0 || issues.binIssues.length > 0) {
          this.logger.warn('═══════════════════════════════════════════════════════');
          this.logger.warn('⚠️ MUAMMOLAR TOPILDI!');
          this.logger.warn('═══════════════════════════════════════════════════════');
          
          if (issues.recentErrors.length > 0) {
            this.logger.warn(`❌ Xatoliklar: ${issues.recentErrors.length} ta`);
            issues.recentErrors.forEach((error, index) => {
              this.logger.warn(`  ${index + 1}. ${error.message}`);
            });
          }
          
          if (issues.vehicleIssues.length > 0) {
            this.logger.warn(`🚛 Mashina muammolari: ${issues.vehicleIssues.length} ta`);
            issues.vehicleIssues.forEach((issue, index) => {
              this.logger.warn(`  ${index + 1}. ${issue}`);
            });
          }
          
          if (issues.binIssues.length > 0) {
            this.logger.warn(`🗑️ Quti muammolari: ${issues.binIssues.length} ta`);
            issues.binIssues.forEach((issue, index) => {
              this.logger.warn(`  ${index + 1}. ${issue}`);
            });
          }
          
          this.logger.warn('═══════════════════════════════════════════════════════');
        } else {
          this.logger.log('✅ Health check: Barcha tizimlar normal ishlayapti');
        }
      } catch (error) {
        this.logger.error('❌ Health check xatolik:', error.message);
      }
    }, 5 * 60 * 1000); // 5 daqiqa
  }
}
