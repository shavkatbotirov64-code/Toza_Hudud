import { IsString, IsNotEmpty, IsEmail, MinLength, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminDto {
  @ApiProperty({ example: 'admin1', description: 'Admin username' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: 'admin@tozahudud.uz', description: 'Admin email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Admin123!', description: 'Admin password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ 
    example: 'admin', 
    description: 'Admin role',
    enum: ['super_admin', 'admin']
  })
  @IsString()
  @IsIn(['super_admin', 'admin'])
  role: 'super_admin' | 'admin';
}