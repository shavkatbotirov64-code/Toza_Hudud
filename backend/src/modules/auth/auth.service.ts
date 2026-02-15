import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminService, Admin } from './admin.service';
import { ActivityLogService } from './activity-log.service';
import { LoginDto } from './dto/login.dto';

export interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly adminService: AdminService,
    private readonly jwtService: JwtService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    try {
      this.logger.log(`🔐 Login attempt: ${loginDto.username}`);
      
      const admin = await this.adminService.validateAdmin(loginDto.username, loginDto.password);
      
      if (!admin) {
        this.logger.warn(`❌ Invalid login attempt: ${loginDto.username}`);
        throw new UnauthorizedException('Noto\'g\'ri username yoki parol');
      }

      if (!admin.isActive) {
        this.logger.warn(`❌ Inactive admin login attempt: ${loginDto.username}`);
        throw new UnauthorizedException('Admin hisobi faol emas');
      }

      const payload: JwtPayload = {
        sub: admin.id,
        username: admin.username,
        role: admin.role,
      };

      const accessToken = this.jwtService.sign(payload);

      // Faoliyatni log qilish
      await this.activityLogService.logActivity(
        admin.id,
        admin.username,
        'LOGIN',
        'Tizimga kirish',
        ipAddress,
        userAgent
      );

      this.logger.log(`✅ Successful login: ${admin.username}`);

      return {
        success: true,
        data: {
          accessToken,
          admin: {
            id: admin.id,
            username: admin.username,
            email: admin.email,
            role: admin.role,
            lastLogin: admin.lastLogin,
          },
        },
      };
    } catch (error) {
      this.logger.error(`❌ Login error: ${error.message}`);
      throw error;
    }
  }

  async logout(adminId: string, adminUsername: string, ipAddress?: string, userAgent?: string) {
    try {
      // Faoliyatni log qilish
      await this.activityLogService.logActivity(
        adminId,
        adminUsername,
        'LOGOUT',
        'Tizimdan chiqish',
        ipAddress,
        userAgent
      );

      this.logger.log(`✅ Logout: ${adminUsername}`);

      return {
        success: true,
        message: 'Muvaffaqiyatli chiqildi',
      };
    } catch (error) {
      this.logger.error(`❌ Logout error: ${error.message}`);
      throw error;
    }
  }
}