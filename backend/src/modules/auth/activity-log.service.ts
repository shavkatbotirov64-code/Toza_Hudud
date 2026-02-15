import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface ActivityLog {
  id: string;
  adminId: string;
  adminUsername: string;
  action: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);
  private readonly logsFilePath = path.join(process.cwd(), 'activity-logs.json');

  constructor() {
    this.initializeLogsFile();
  }

  private initializeLogsFile() {
    try {
      if (!fs.existsSync(this.logsFilePath)) {
        fs.writeFileSync(this.logsFilePath, JSON.stringify([], null, 2));
        this.logger.log('✅ Activity logs file initialized');
      }
    } catch (error) {
      this.logger.error(`❌ Error initializing logs file: ${error.message}`);
    }
  }

  private getLogs(): ActivityLog[] {
    try {
      if (!fs.existsSync(this.logsFilePath)) {
        return [];
      }
      const data = fs.readFileSync(this.logsFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      this.logger.error(`❌ Error reading logs: ${error.message}`);
      return [];
    }
  }

  private saveLogs(logs: ActivityLog[]) {
    try {
      // Faqat oxirgi 1000 ta log'ni saqlash
      const logsToSave = logs.slice(-1000);
      fs.writeFileSync(this.logsFilePath, JSON.stringify(logsToSave, null, 2));
    } catch (error) {
      this.logger.error(`❌ Error saving logs: ${error.message}`);
    }
  }

  async logActivity(
    adminId: string,
    adminUsername: string,
    action: string,
    details: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const logs = this.getLogs();
      
      const newLog: ActivityLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        adminId,
        adminUsername,
        action,
        details,
        ipAddress,
        userAgent,
        timestamp: new Date().toISOString(),
      };

      logs.push(newLog);
      this.saveLogs(logs);

      this.logger.log(`📝 Activity logged: ${adminUsername} - ${action}`);
    } catch (error) {
      this.logger.error(`❌ Error logging activity: ${error.message}`);
    }
  }

  async getRecentLogs(limit: number = 100): Promise<ActivityLog[]> {
    try {
      const logs = this.getLogs();
      return logs
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      this.logger.error(`❌ Error getting recent logs: ${error.message}`);
      return [];
    }
  }

  async getLogsByAdmin(adminId: string, limit: number = 50): Promise<ActivityLog[]> {
    try {
      const logs = this.getLogs();
      return logs
        .filter(log => log.adminId === adminId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      this.logger.error(`❌ Error getting logs by admin: ${error.message}`);
      return [];
    }
  }

  async getLogsByDateRange(startDate: string, endDate: string): Promise<ActivityLog[]> {
    try {
      const logs = this.getLogs();
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      return logs
        .filter(log => {
          const logDate = new Date(log.timestamp);
          return logDate >= start && logDate <= end;
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      this.logger.error(`❌ Error getting logs by date range: ${error.message}`);
      return [];
    }
  }
}