import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DispatchService } from './dispatch.service';

@ApiTags('dispatch')
@Controller('dispatch')
export class DispatchController {
  private readonly logger = new Logger(DispatchController.name);

  constructor(private readonly dispatchService: DispatchService) {}

  @Post('find-closest')
  @ApiOperation({ summary: 'Eng yaqin mashinani topish' })
  @ApiResponse({ status: 200, description: 'Eng yaqin mashina topildi' })
  async findClosestVehicle(
    @Body()
    data: {
      binId: string;
      vehicles: Array<{
        id: string;
        vehicleId: string;
        driverName: string;
        currentLatitude: string;
        currentLongitude: string;
        isMoving: boolean;
        status: string;
      }>;
    },
  ) {
    try {
      const result = await this.dispatchService.findClosestVehicle(
        data.binId,
        data.vehicles,
      );
      return result;
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('dispatch')
  @ApiOperation({ summary: 'Mashinani qutiga yo\'naltirish' })
  @ApiResponse({ status: 200, description: 'Mashina yo\'naltirildi' })
  async dispatchVehicle(
    @Body()
    data: {
      binId: string;
      vehicles: Array<{
        id: string;
        vehicleId: string;
        driverName: string;
        currentLatitude: string;
        currentLongitude: string;
        isMoving: boolean;
        status: string;
      }>;
    },
  ) {
    try {
      const result = await this.dispatchService.dispatchVehicleToBin(
        data.binId,
        data.vehicles,
      );
      return result;
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
