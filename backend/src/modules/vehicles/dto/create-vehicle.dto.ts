import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { VehicleType, VehicleStatus } from '../entities/vehicle.entity';

export class CreateVehicleDto {
  @ApiProperty({ example: 'VEH-001', description: 'Unique vehicle code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: '01A123BC', description: 'Vehicle license plate' })
  @IsString()
  @IsNotEmpty()
  licensePlate: string;

  @ApiProperty({ example: 'Alisher Karimov', description: 'Driver full name' })
  @IsString()
  @IsNotEmpty()
  driverName: string;

  @ApiProperty({ example: '+998901234567', description: 'Driver phone number' })
  @IsString()
  @IsNotEmpty()
  driverPhone: string;

  @ApiProperty({ 
    enum: VehicleType, 
    example: VehicleType.MEDIUM_TRUCK,
    description: 'Vehicle type'
  })
  @IsEnum(VehicleType)
  type: VehicleType;

  @ApiProperty({ 
    enum: VehicleStatus, 
    example: VehicleStatus.INACTIVE,
    description: 'Vehicle status',
    required: false
  })
  @IsEnum(VehicleStatus)
  @IsOptional()
  status?: VehicleStatus;

  @ApiProperty({ example: 1000, description: 'Vehicle capacity in kg' })
  @IsNumber()
  @Min(100)
  @Max(10000)
  capacity: number;

  @ApiProperty({ example: 'GPS-001', description: 'GPS tracker ID', required: false })
  @IsString()
  @IsOptional()
  gpsTrackerId?: string;
}