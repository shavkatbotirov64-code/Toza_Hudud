import { PartialType } from '@nestjs/swagger';
import { CreateAlertDto } from './create-alert.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { AlertStatus } from '../entities/alert.entity';

export class UpdateAlertDto extends PartialType(CreateAlertDto) {
  @ApiProperty({ 
    enum: AlertStatus, 
    example: AlertStatus.ACKNOWLEDGED,
    description: 'Alert status',
    required: false
  })
  @IsEnum(AlertStatus)
  @IsOptional()
  status?: AlertStatus;

  @ApiProperty({ 
    example: true, 
    description: 'Mark alert as read',
    required: false
  })
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;
}