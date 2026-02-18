import { Controller, Post, Get, Put, Body, Param, Query, Logger } from '@nestjs/common';
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

  // ✨ YANGI: Dispatch tarixi

  @Get('history')
  @ApiOperation({ summary: 'Dispatch tarixi' })
  @ApiResponse({ status: 200, description: 'Dispatch tarixi' })
  async getHistory(@Query('limit') limit?: string) {
    try {
      const result = await this.dispatchService.getDispatchHistory(
        limit ? parseInt(limit) : 50,
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

  @Post('create')
  @ApiOperation({ summary: 'Qo\'lda dispatch yaratish' })
  @ApiResponse({ status: 201, description: 'Dispatch yaratildi' })
  async createDispatch(
    @Body()
    data: {
      vehicleId: string;
      binId: string;
      priority?: string;
      notes?: string;
    },
  ) {
    try {
      const result = await this.dispatchService.createDispatch(data);
      return result;
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Put(':dispatchId/status')
  @ApiOperation({ summary: 'Dispatch holatini yangilash' })
  @ApiResponse({ status: 200, description: 'Holat yangilandi' })
  async updateStatus(
    @Param('dispatchId') dispatchId: string,
    @Body() data: { status: string; notes?: string },
  ) {
    try {
      const result = await this.dispatchService.updateDispatchStatus(
        dispatchId,
        data.status,
        data.notes,
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

  @Get('vehicle/:vehicleId')
  @ApiOperation({ summary: 'Mashina bo\'yicha dispatch tarixi' })
  @ApiResponse({ status: 200, description: 'Dispatch tarixi' })
  async getByVehicle(
    @Param('vehicleId') vehicleId: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const result = await this.dispatchService.getDispatchesByVehicle(
        vehicleId,
        limit ? parseInt(limit) : 20,
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

  @Get('bin/:binId')
  @ApiOperation({ summary: 'Quti bo\'yicha dispatch tarixi' })
  @ApiResponse({ status: 200, description: 'Dispatch tarixi' })
  async getByBin(
    @Param('binId') binId: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const result = await this.dispatchService.getDispatchesByBin(
        binId,
        limit ? parseInt(limit) : 20,
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
