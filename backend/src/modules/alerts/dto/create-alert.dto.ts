import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID, IsNumber, Min, Max } from 'class-validator';
import { AlertType, AlertSeverity } from '../entities/alert.entity';

export class CreateAlertDto {
  @ApiProperty({ 
    enum: AlertType, 
    example: AlertType.BIN_FULL,
    description: 'Alert type'
  })
  @IsEnum(AlertType)
  type: AlertType;

  @ApiProperty({ 
    enum: AlertSeverity, 
    example: AlertSeverity.HIGH,
    description: 'Alert severity',
    required: false
  })
  @IsEnum(AlertSeverity)
  @IsOptional()
  severity?: AlertSeverity;

  @ApiProperty({ example: 'Bin Full Alert', description: 'Alert title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ 
    example: 'Bin BIN-001 is 95% full and needs immediate collection', 
    description: 'Alert message'
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ 
    example: 'uuid-of-bin', 
    description: 'Related bin ID',
    required: false
  })
  @IsUUID()
  @IsOptional()
  binId?: string;

  @ApiProperty({ 
    example: 'uuid-of-vehicle', 
    description: 'Related vehicle ID',
    required: false
  })
  @IsUUID()
  @IsOptional()
  vehicleId?: string;

  @ApiProperty({ 
    example: 'uuid-of-route', 
    description: 'Related route ID',
    required: false
  })
  @IsUUID()
  @IsOptional()
  routeId?: string;

  @ApiProperty({ 
    example: { fillLevel: 95, sensorId: 'SENSOR-001' }, 
    description: 'Additional metadata',
    required: false
  })
  @IsOptional()
  metadata?: any;

  @ApiProperty({ 
    example: 'Amir Temur ko\'chasi 123, Yakkasaroy', 
    description: 'Alert location',
    required: false
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ 
    example: 41.284, 
    description: 'Latitude coordinate',
    required: false
  })
  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiProperty({ 
    example: 69.279, 
    description: 'Longitude coordinate',
    required: false
  })
  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;
}