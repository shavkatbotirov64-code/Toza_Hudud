import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class UpdateLocationDto {
  @ApiProperty({ example: 41.2995, description: 'Vehicle latitude coordinate' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 69.2401, description: 'Vehicle longitude coordinate' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ example: 35.5, description: 'Current speed in km/h', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(120)
  speed?: number;
}