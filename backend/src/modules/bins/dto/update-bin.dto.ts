import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateBinDto } from './create-bin.dto';
import {
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class UpdateBinDto extends PartialType(CreateBinDto) {
  @ApiProperty({ example: 75.5, required: false })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  fillLevel?: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isOnline?: boolean;

  @ApiProperty({ example: 85, required: false })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  batteryLevel?: number;

  @ApiProperty({ example: 23.5, required: false })
  @IsNumber()
  @IsOptional()
  temperature?: number;

  @ApiProperty({ example: 65.2, required: false })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  humidity?: number;

  @ApiProperty({ example: '2024-01-01T10:30:00Z', required: false })
  @IsDateString()
  @IsOptional()
  lastCleaned?: string;
}