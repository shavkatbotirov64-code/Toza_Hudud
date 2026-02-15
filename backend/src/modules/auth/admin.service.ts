import { Injectable, Logger, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { CreateAdminDto } from './dto/create-admin.dto';

export interface Admin {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'super_admin' | 'admin';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  createdBy?: string;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private readonly adminsFilePath = path.join(process.cwd(), 'admins.json');

  constructor() {
    this.initializeAdminsFile();
  }

  private initializeAdminsFile() {
    try {
      if (!fs.existsSync(this.adminsFilePath)) {
        // Super admin yaratish
        const superAdmin: Admin = {
          id: 'super-admin-001',
          username: 'superadmin',
          email: 'superadmin@tozahudud.uz',
          password: 'SuperAdmin2026!',
          role: 'super_admin',
          isActive: true,
          createdAt: new Date().toISOString(),
        };

        const admins = [superAdmin];
        fs.writeFileSync(this.adminsFilePath, JSON.stringify(admins, null, 2));
        this.logger.log('✅ Super admin created: superadmin / SuperAdmin2026!');
      }
    } catch (error) {
      this.logger.error(`❌ Error initializing admins file: ${error.message}`);
    }
  }

  private getAdmins(): Admin[] {
    try {
      if (!fs.existsSync(this.adminsFilePath)) {
        return [];
      }
      const data = fs.readFileSync(this.adminsFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      this.logger.error(`❌ Error reading admins: ${error.message}`);
      return [];
    }
  }

  private saveAdmins(admins: Admin[]) {
    try {
      fs.writeFileSync(this.adminsFilePath, JSON.stringify(admins, null, 2));
    } catch (error) {
      this.logger.error(`❌ Error saving admins: ${error.message}`);
      throw error;
    }
  }

  async validateAdmin(username: string, password: string): Promise<Admin | null> {
    try {
      const admins = this.getAdmins();
      const admin = admins.find(a => a.username === username && a.isActive);
      
      if (!admin) {
        return null;
      }

      const isPasswordValid = password === admin.password;
      if (!isPasswordValid) {
        return null;
      }

      // Oxirgi login vaqtini yangilash
      admin.lastLogin = new Date().toISOString();
      this.saveAdmins(admins);

      // Parolni qaytarmaslik
      const { password: _, ...adminWithoutPassword } = admin;
      return adminWithoutPassword as Admin;
    } catch (error) {
      this.logger.error(`❌ Error validating admin: ${error.message}`);
      return null;
    }
  }

  async findById(id: string): Promise<Admin | null> {
    try {
      const admins = this.getAdmins();
      const admin = admins.find(a => a.id === id);
      
      if (!admin) {
        return null;
      }

      const { password: _, ...adminWithoutPassword } = admin;
      return adminWithoutPassword as Admin;
    } catch (error) {
      this.logger.error(`❌ Error finding admin by ID: ${error.message}`);
      return null;
    }
  }

  async createAdmin(createAdminDto: CreateAdminDto, createdBy: string): Promise<Admin> {
    try {
      const admins = this.getAdmins();
      
      // Username va email unique ekanligini tekshirish
      const existingAdmin = admins.find(a => 
        a.username === createAdminDto.username || a.email === createAdminDto.email
      );
      
      if (existingAdmin) {
        throw new ConflictException('Username yoki email allaqachon mavjud');
      }
      
      const newAdmin: Admin = {
        id: `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        username: createAdminDto.username,
        email: createAdminDto.email,
        password: createAdminDto.password,
        role: createAdminDto.role,
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy,
      };

      admins.push(newAdmin);
      this.saveAdmins(admins);

      this.logger.log(`✅ New admin created: ${newAdmin.username} by ${createdBy}`);

      const { password: _, ...adminWithoutPassword } = newAdmin;
      return adminWithoutPassword as Admin;
    } catch (error) {
      this.logger.error(`❌ Error creating admin: ${error.message}`);
      throw error;
    }
  }

  async getAllAdmins(): Promise<Admin[]> {
    try {
      const admins = this.getAdmins();
      return admins.map(admin => {
        const { password: _, ...adminWithoutPassword } = admin;
        return adminWithoutPassword as Admin;
      });
    } catch (error) {
      this.logger.error(`❌ Error getting all admins: ${error.message}`);
      return [];
    }
  }

  async deleteAdmin(adminId: string, deletedBy: string): Promise<boolean> {
    try {
      const admins = this.getAdmins();
      const adminIndex = admins.findIndex(a => a.id === adminId);
      
      if (adminIndex === -1) {
        throw new NotFoundException('Admin topilmadi');
      }

      const adminToDelete = admins[adminIndex];
      
      // Super admin o'zini o'chira olmaydi
      if (adminToDelete.role === 'super_admin') {
        throw new UnauthorizedException('Super admin o\'chirib bo\'lmaydi');
      }

      admins.splice(adminIndex, 1);
      this.saveAdmins(admins);

      this.logger.log(`✅ Admin deleted: ${adminToDelete.username} by ${deletedBy}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Error deleting admin: ${error.message}`);
      throw error;
    }
  }

  async toggleAdminStatus(adminId: string, modifiedBy: string): Promise<Admin> {
    try {
      const admins = this.getAdmins();
      const admin = admins.find(a => a.id === adminId);
      
      if (!admin) {
        throw new NotFoundException('Admin topilmadi');
      }

      if (admin.role === 'super_admin') {
        throw new UnauthorizedException('Super admin holatini o\'zgartirib bo\'lmaydi');
      }

      admin.isActive = !admin.isActive;
      this.saveAdmins(admins);

      this.logger.log(`✅ Admin status changed: ${admin.username} -> ${admin.isActive ? 'active' : 'inactive'} by ${modifiedBy}`);

      const { password: _, ...adminWithoutPassword } = admin;
      return adminWithoutPassword as Admin;
    } catch (error) {
      this.logger.error(`❌ Error toggling admin status: ${error.message}`);
      throw error;
    }
  }
}