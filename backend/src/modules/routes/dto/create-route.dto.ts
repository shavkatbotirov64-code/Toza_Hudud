import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, IsUUID, IsDateString } from 'class-validator';
import { RouteStatus, RoutePriority } from '../entities/route.entity';

export class CreateRouteDto {
  @ApiProperty({ example: 'Yakkasaroy District Route', description: 'Route name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    example: 'Daily collection route for Yakkasaroy district', 
    description: 'Route description',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    example: 'uuid-of-vehicle', 
    description: 'Assigned vehicle ID',
    required: false
  })
  @IsUUID()
  @IsOptional()
  assignedVehicleId?: string;

  @ApiProperty({ 
    enum: RoutePriority, 
    example: RoutePriority.MEDIUM,
    description: 'Route priority',
    required: false
  })
  @IsEnum(RoutePriority)
  @IsOptional()
  priority?: RoutePriority;

  @ApiProperty({ 
    example: '2025-12-30T08:00:00Z', 
    description: 'Scheduled start time',
    required: false
  })
  @IsDateString()
  @IsOptional()
  scheduledStartTime?: string;

  @ApiProperty({ 
    example: ['uuid-1', 'uuid-2', 'uuid-3'], 
    description: 'Array of bin IDs in sequence order',
    type: [String]
  })
  @IsArray()
  @IsUUID('4', { each: true })
  binIds: string[];
}