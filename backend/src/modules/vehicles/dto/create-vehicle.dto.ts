import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: 'VEH-001', description: 'Unique vehicle ID' })
  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @ApiProperty({ example: 'Akmaljon Karimov', description: 'Driver full name' })
  @IsString()
  @IsNotEmpty()
  driver: string;

  @ApiProperty({ example: 39.6542, description: 'Latitude' })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 66.9597, description: 'Longitude' })
  @IsNumber()
  longitude: number;

  @ApiProperty({ example: 'idle', description: 'Vehicle status', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: false, description: 'Is vehicle moving', required: false })
  @IsBoolean()
  @IsOptional()
  isMoving?: boolean;

  @ApiProperty({ example: 'ESP32-IBN-SINO', description: 'Target bin ID', required: false })
  @IsString()
  @IsOptional()
  targetBinId?: string;
}