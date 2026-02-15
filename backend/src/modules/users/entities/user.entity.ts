import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
  DRIVER = 'driver',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('users')
export class User {
  @ApiProperty({ example: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'admin' })
  @Column({ unique: true, length: 100 })
  username: string;

  @ApiProperty({ example: 'admin@smarttrash.uz' })
  @Column({ unique: true, length: 200 })
  email: string;

  @Column({ length: 255 })
  password: string;

  @ApiProperty({ example: 'Alisher Karimov' })
  @Column({ length: 200 })
  fullName: string;

  @ApiProperty({ example: '+998901234567' })
  @Column({ length: 20, nullable: true })
  phone: string;

  @ApiProperty({ enum: UserRole })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VIEWER,
  })
  role: UserRole;

  @ApiProperty({ enum: UserStatus })
  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @ApiProperty({ example: 'profile-picture.jpg' })
  @Column({ length: 500, nullable: true })
  avatar: string;

  @ApiProperty({ example: '2024-01-01T10:30:00Z' })
  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @ApiProperty({ example: '192.168.1.100' })
  @Column({ length: 45, nullable: true })
  lastLoginIp: string;

  @ApiProperty({ example: true })
  @Column({ default: true })
  isEmailVerified: boolean;

  @ApiProperty({ example: 'verification-token' })
  @Column({ length: 255, nullable: true })
  emailVerificationToken: string;

  @ApiProperty({ example: 'reset-token' })
  @Column({ length: 255, nullable: true })
  passwordResetToken: string;

  @ApiProperty({ example: '2024-01-01T12:00:00Z' })
  @Column({ type: 'timestamp', nullable: true })
  passwordResetExpires: Date;

  @ApiProperty({ example: { theme: 'dark', language: 'uz' } })
  @Column('jsonb', { nullable: true })
  preferences: any;

  async validatePassword(password: string): Promise<boolean> {
    return this.password === password;
  }

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  @UpdateDateColumn()
  updatedAt: Date;
}