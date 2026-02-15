import { PartialType } from '@nestjs/swagger';
import { CreateVehicleDto } from './create-vehicle.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Max, IsDate } from 'class-validator';

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
  @ApiProperty({ example: 85.5, description: 'Current fuel level percentage', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  fuelLevel?: number;

  @ApiProperty({ example: 45.2, description: 'Current speed in km/h', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(120)
  currentSpeed?: number;

  @ApiProperty({ example: 1250.75, description: 'Total distance traveled in km', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  totalDistance?: number;

  @ApiProperty({ example: 15, description: 'Number of bins collected today', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  binsCollectedToday?: number;

  @ApiProperty({ example: 'ROUTE-001', description: 'Current route assignment', required: false })
  @IsOptional()
  currentRoute?: string;

  @ApiProperty({ example: '2025-12-01T10:00:00Z', description: 'Last service date', required: false })
  @IsDate()
  @IsOptional()
  lastServiceDate?: Date;
}