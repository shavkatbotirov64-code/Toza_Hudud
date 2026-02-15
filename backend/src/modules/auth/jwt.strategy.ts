import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AdminService } from './admin.service';

export interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly adminService: AdminService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'smart-trash-secret-key-2024-toza-hudud-ai-system',
    });
    console.log('🔧 JWT Strategy initialized with secret:', process.env.JWT_SECRET || 'toza-hudud-secret-key-2026');
  }

  async validate(payload: JwtPayload) {
    try {
      const admin = await this.adminService.findById(payload.sub);
      
      if (!admin || !admin.isActive) {
        throw new UnauthorizedException('Admin topilmadi yoki faol emas');
      }

      return admin;
    } catch (error) {
      throw new UnauthorizedException('Noto\'g\'ri token');
    }
  }
}