import { 
  Controller, 
  Post, 
  Get, 
  Delete, 
  Patch,
  Body, 
  Param,
  Query,
  UseGuards, 
  Request,
  Logger,
  UnauthorizedException,
  Ip,
  Headers
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AdminService } from './admin.service';
import { ActivityLogService } from './activity-log.service';
import { LoginDto } from './dto/login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SuperAdminGuard } from './super-admin.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly adminService: AdminService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Admin login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    try {
      this.logger.log(`🔐 Login request from ${ipAddress}: ${loginDto.username}`);
      return await this.authService.login(loginDto, ipAddress, userAgent);
    } catch (error) {
      this.logger.error(`❌ Login failed: ${error.message}`);
      throw error;
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @Request() req,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    try {
      return await this.authService.logout(req.user.id, req.user.username, ipAddress, userAgent);
    } catch (error) {
      this.logger.error(`❌ Logout failed: ${error.message}`);
      throw error;
    }
  }

  @Get('test-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test token validity' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  async testToken(@Request() req) {
    try {
      return {
        success: true,
        message: 'Token is valid',
        admin: req.user
      };
    } catch (error) {
      this.logger.error(`❌ Test token failed: ${error.message}`);
      throw error;
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current admin profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@Request() req) {
    try {
      return {
        success: true,
        data: req.user,
      };
    } catch (error) {
      this.logger.error(`❌ Get profile failed: ${error.message}`);
      throw error;
    }
  }

  @Post('admins')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new admin (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Admin created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin required' })
  async createAdmin(
    @Body() createAdminDto: CreateAdminDto,
    @Request() req,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    try {
      const newAdmin = await this.adminService.createAdmin(createAdminDto, req.user.username);
      
      // Faoliyatni log qilish
      await this.activityLogService.logActivity(
        req.user.id,
        req.user.username,
        'CREATE_ADMIN',
        `Yangi admin yaratildi: ${createAdminDto.username} (${createAdminDto.role})`,
        ipAddress,
        userAgent
      );

      return {
        success: true,
        data: newAdmin,
        message: 'Admin muvaffaqiyatli yaratildi',
      };
    } catch (error) {
      this.logger.error(`❌ Create admin failed: ${error.message}`);
      throw error;
    }
  }

  @Get('admins')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all admins (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Admins retrieved successfully' })
  async getAllAdmins(@Request() req) {
    try {
      const admins = await this.adminService.getAllAdmins();
      return {
        success: true,
        data: admins,
      };
    } catch (error) {
      this.logger.error(`❌ Get all admins failed: ${error.message}`);
      throw error;
    }
  }

  @Delete('admins/:id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete admin (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Admin deleted successfully' })
  async deleteAdmin(
    @Param('id') adminId: string,
    @Request() req,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    try {
      await this.adminService.deleteAdmin(adminId, req.user.username);
      
      // Faoliyatni log qilish
      await this.activityLogService.logActivity(
        req.user.id,
        req.user.username,
        'DELETE_ADMIN',
        `Admin o'chirildi: ID ${adminId}`,
        ipAddress,
        userAgent
      );

      return {
        success: true,
        message: 'Admin muvaffaqiyatli o\'chirildi',
      };
    } catch (error) {
      this.logger.error(`❌ Delete admin failed: ${error.message}`);
      throw error;
    }
  }

  @Patch('admins/:id/toggle-status')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle admin status (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Admin status updated successfully' })
  async toggleAdminStatus(
    @Param('id') adminId: string,
    @Request() req,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ) {
    try {
      const updatedAdmin = await this.adminService.toggleAdminStatus(adminId, req.user.username);
      
      // Faoliyatni log qilish
      await this.activityLogService.logActivity(
        req.user.id,
        req.user.username,
        'TOGGLE_ADMIN_STATUS',
        `Admin holati o'zgartirildi: ${updatedAdmin.username} -> ${updatedAdmin.isActive ? 'faol' : 'nofaol'}`,
        ipAddress,
        userAgent
      );

      return {
        success: true,
        data: updatedAdmin,
        message: 'Admin holati muvaffaqiyatli o\'zgartirildi',
      };
    } catch (error) {
      this.logger.error(`❌ Toggle admin status failed: ${error.message}`);
      throw error;
    }
  }

  @Get('activity-logs')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get activity logs (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Activity logs retrieved successfully' })
  async getActivityLogs(
    @Query('limit') limit: string = '100',
    @Query('adminId') adminId?: string
  ) {
    try {
      let logs;
      if (adminId) {
        logs = await this.activityLogService.getLogsByAdmin(adminId, parseInt(limit));
      } else {
        logs = await this.activityLogService.getRecentLogs(parseInt(limit));
      }

      return {
        success: true,
        data: logs,
      };
    } catch (error) {
      this.logger.error(`❌ Get activity logs failed: ${error.message}`);
      throw error;
    }
  }

  @Get('activity-logs/date-range')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get activity logs by date range (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Activity logs retrieved successfully' })
  async getActivityLogsByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    try {
      const logs = await this.activityLogService.getLogsByDateRange(startDate, endDate);
      return {
        success: true,
        data: logs,
      };
    } catch (error) {
      this.logger.error(`❌ Get activity logs by date range failed: ${error.message}`);
      throw error;
    }
  }
}