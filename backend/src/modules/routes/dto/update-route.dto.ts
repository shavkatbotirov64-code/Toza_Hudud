import { PartialType } from '@nestjs/swagger';
import { CreateRouteDto } from './create-route.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class UpdateRouteDto extends PartialType(CreateRouteDto) {
  @ApiProperty({ 
    example: 25.5, 
    description: 'Total route distance in km',
    required: false
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  totalDistance?: number;

  @ApiProperty({ 
    example: 180, 
    description: 'Estimated duration in minutes',
    required: false
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  estimatedDuration?: number;

  @ApiProperty({ 
    example: 75.5, 
    description: 'Completion percentage',
    required: false
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  completionPercentage?: number;
}