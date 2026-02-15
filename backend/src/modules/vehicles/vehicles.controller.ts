import { Controller, Get, Post, Put, Body, Param, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';

@ApiTags('vehicles')
@Controller('vehicles')
export class VehiclesController {
  private readonly logger = new Logger(VehiclesController.name);

  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post('status')
  @ApiOperation({ summary: 'Mashina holatini yaratish yoki yangilash' })
  @ApiResponse({ status: 200, description: 'Mashina holati saqlandi' })
  async upsertVehicle(@Body() data: {
    vehicleId: string;
    driver: string;
    latitude: number;
    longitude: number;
    status?: string;
  }) {
    try {
      const vehicle = await this.vehiclesService.upsertVehicle(data);
      return {
        success: true,
        data: vehicle,
      };
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get(':vehicleId/status')
  @ApiOperation({ summary: 'Mashina holatini olish' })
  @ApiResponse({ status: 200, description: 'Mashina holati' })
  async getVehicleStatus(@Param('vehicleId') vehicleId: string) {
    try {
      const vehicle = await this.vehiclesService.getVehicleStatus(vehicleId);
      return {
        success: true,
        data: vehicle,
      };
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get()
  @ApiOperation({ summary: 'Barcha mashinalar' })
  @ApiResponse({ status: 200, description: 'Mashinalar ro\'yxati' })
  async getAllVehicles() {
    try {
      const vehicles = await this.vehiclesService.getAllVehicles();
      return {
        success: true,
        data: vehicles,
      };
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  @Put(':vehicleId/location')
  @ApiOperation({ summary: 'Mashina lokatsiyasini yangilash' })
  @ApiResponse({ status: 200, description: 'Lokatsiya yangilandi' })
  async updateLocation(
    @Param('vehicleId') vehicleId: string,
    @Body() data: { latitude: number; longitude: number },
  ) {
    try {
      const vehicle = await this.vehiclesService.updateLocation(
        vehicleId,
        data.latitude,
        data.longitude,
      );
      return {
        success: true,
        data: vehicle,
      };
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Put(':vehicleId/start-moving')
  @ApiOperation({ summary: 'Mashina harakatni boshlash' })
  @ApiResponse({ status: 200, description: 'Harakat boshlandi' })
  async startMoving(
    @Param('vehicleId') vehicleId: string,
    @Body() data: { targetBinId: string },
  ) {
    try {
      const vehicle = await this.vehiclesService.startMoving(
        vehicleId,
        data.targetBinId,
      );
      return {
        success: true,
        data: vehicle,
      };
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Put(':vehicleId/stop')
  @ApiOperation({ summary: 'Mashinani to\'xtatish' })
  @ApiResponse({ status: 200, description: 'Mashina to\'xtadi' })
  async stopMoving(@Param('vehicleId') vehicleId: string) {
    try {
      const vehicle = await this.vehiclesService.stopMoving(vehicleId);
      return {
        success: true,
        data: vehicle,
      };
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Put(':vehicleId/complete-cleaning')
  @ApiOperation({ summary: 'Tozalash tugadi' })
  @ApiResponse({ status: 200, description: 'Tozalash tugallandi' })
  async completeCleaning(@Param('vehicleId') vehicleId: string) {
    try {
      const vehicle = await this.vehiclesService.completeCleaning(vehicleId);
      return {
        success: true,
        data: vehicle,
      };
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Put(':vehicleId/add-distance')
  @ApiOperation({ summary: 'Bosib o\'tgan masofani qo\'shish' })
  @ApiResponse({ status: 200, description: 'Masofa qo\'shildi' })
  async addDistance(
    @Param('vehicleId') vehicleId: string,
    @Body() data: { distanceKm: number },
  ) {
    try {
      const vehicle = await this.vehiclesService.addDistance(
        vehicleId,
        data.distanceKm,
      );
      return {
        success: true,
        data: vehicle,
      };
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
