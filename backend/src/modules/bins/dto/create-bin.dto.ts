import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  Max,
  Length,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { BinType, BinStatus } from '../entities/bin.entity';

export class CreateBinDto {
  @ApiProperty({ example: 'BIN-001', description: 'Unique bin code' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  code: string;

  @ApiProperty({ example: 'Amir Temur ko\'chasi 123, Yakkasaroy' })
  @IsString()
  @IsNotEmpty()
  @Length(10, 500)
  address: string;

  @ApiProperty({ example: 'yakkasaroy' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  district: string;

  @ApiProperty({ example: 41.284 })
  @IsNumber()
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: 69.279 })
  @IsNumber()
  @IsLongitude()
  longitude: number;

  @ApiProperty({ example: 120, description: 'Capacity in liters' })
  @IsNumber()
  @Min(50)
  @Max(1000)
  capacity: number;

  @ApiProperty({ enum: BinType, example: BinType.GENERAL })
  @IsEnum(BinType)
  @IsOptional()
  type?: BinType;

  @ApiProperty({ enum: BinStatus, example: BinStatus.ACTIVE })
  @IsEnum(BinStatus)
  @IsOptional()
  status?: BinStatus;

  @ApiProperty({ example: 'SENSOR-001', required: false })
  @IsString()
  @IsOptional()
  @Length(3, 100)
  sensorId?: string;

  @ApiProperty({ example: 0, description: 'Initial fill level', required: false })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  fillLevel?: number;
}