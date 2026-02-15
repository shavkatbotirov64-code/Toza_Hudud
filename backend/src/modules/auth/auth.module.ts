import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { AdminService } from './admin.service';
import { ActivityLogService } from './activity-log.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'smart-trash-secret-key-2024-toza-hudud-ai-system',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AdminService, ActivityLogService, JwtStrategy],
  exports: [AuthService, AdminService, ActivityLogService],
})
export class AuthModule {}