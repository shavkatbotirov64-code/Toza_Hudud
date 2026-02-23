import { Body, Controller, Delete, Get, Logger, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DispatchService } from '../sensors/dispatch.service';
import { VehiclesService } from './vehicles.service';

@ApiTags('vehicles')
@Controller('vehicles')
export class VehiclesController {
  private readonly logger = new Logger(VehiclesController.name);

  constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly dispatchService: DispatchService,
  ) {}

  @Post('status')
  @ApiOperation({ summary: 'Mashina holatini yaratish yoki yangilash' })
  @ApiResponse({ status: 200, description: 'Mashina holati saqlandi' })
  async upsertVehicle(
    @Body()
    data: {
      vehicleId: string;
      driver: string;
      latitude: number;
      longitude: number;
      status?: string;
    },
  ) {
    try {
      const vehicle = await this.vehiclesService.upsertVehicle(data);
      const decorated = await this.dispatchService.decorateVehicleWithRuntimeState(vehicle);
      return {
        success: true,
        data: decorated,
      };
    } catch (error) {
      this.logger.error(`Vehicle upsert failed: ${error.message}`);
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
      const decorated = await this.dispatchService.decorateVehicleWithRuntimeState(vehicle);
      return {
        success: true,
        data: decorated,
      };
    } catch (error) {
      this.logger.error(`Vehicle status fetch failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get()
  @ApiOperation({ summary: 'Barcha mashinalar' })
  @ApiResponse({ status: 200, description: "Mashinalar ro'yxati" })
  async getAllVehicles() {
    try {
      const vehicles = await this.vehiclesService.getAllVehicles();
      const decorated = await this.dispatchService.decorateVehiclesWithRuntimeState(vehicles);
      return {
        success: true,
        data: decorated,
      };
    } catch (error) {
      this.logger.error(`Vehicles list fetch failed: ${error.message}`);
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
      const vehicle = await this.dispatchService.updateVehiclePosition(
        vehicleId,
        data.latitude,
        data.longitude,
      );
      return {
        success: true,
        data: vehicle,
      };
    } catch (error) {
      this.logger.error(`Vehicle location update failed: ${error.message}`);
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
      const vehicle = await this.vehiclesService.startMoving(vehicleId, data.targetBinId);
      const decorated = await this.dispatchService.decorateVehicleWithRuntimeState(vehicle);
      return {
        success: true,
        data: decorated,
      };
    } catch (error) {
      this.logger.error(`Start moving failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Put(':vehicleId/stop')
  @ApiOperation({ summary: "Mashinani to'xtatish" })
  @ApiResponse({ status: 200, description: "Mashina to'xtadi" })
  async stopMoving(@Param('vehicleId') vehicleId: string) {
    try {
      const vehicle = await this.vehiclesService.stopMoving(vehicleId);
      const decorated = await this.dispatchService.decorateVehicleWithRuntimeState(vehicle);
      return {
        success: true,
        data: decorated,
      };
    } catch (error) {
      this.logger.error(`Stop moving failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Put(':vehicleId/complete-cleaning')
  @ApiOperation({ summary: "Tozalashni backend'da yakunlash" })
  @ApiResponse({ status: 200, description: 'Tozalash yakunlandi' })
  async completeCleaning(
    @Param('vehicleId') vehicleId: string,
    @Body() body: { binId?: string; notes?: string; source?: string } = {},
  ) {
    try {
      const result = await this.dispatchService.completeCleaningByVehicle(vehicleId, body || {});
      return result;
    } catch (error) {
      this.logger.error(`Complete cleaning failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Put(':vehicleId/add-distance')
  @ApiOperation({ summary: "Bosib o'tgan masofani qo'shish" })
  @ApiResponse({ status: 200, description: "Masofa qo'shildi" })
  async addDistance(
    @Param('vehicleId') vehicleId: string,
    @Body() data: { distanceKm: number },
  ) {
    try {
      const vehicle = await this.vehiclesService.addDistance(vehicleId, data.distanceKm);
      return {
        success: true,
        data: vehicle,
      };
    } catch (error) {
      this.logger.error(`Add distance failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post()
  @ApiOperation({ summary: "Yangi mashina qo'shish" })
  @ApiResponse({ status: 201, description: 'Mashina yaratildi' })
  async createVehicle(
    @Body()
    data: {
      vehicleId: string;
      driver: string;
      phone?: string;
      licensePlate?: string;
      latitude: number;
      longitude: number;
    },
  ) {
    try {
      const vehicle = await this.vehiclesService.createVehicle(data);
      const decorated = await this.dispatchService.decorateVehicleWithRuntimeState(vehicle);
      return {
        success: true,
        message: 'Vehicle created successfully',
        data: decorated,
      };
    } catch (error) {
      this.logger.error(`Create vehicle failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Put(':id')
  @ApiOperation({ summary: "Mashina ma'lumotlarini yangilash" })
  @ApiResponse({ status: 200, description: 'Mashina yangilandi' })
  async updateVehicle(@Param('id') id: string, @Body() data: any) {
    try {
      const vehicle = await this.vehiclesService.updateVehicle(id, data);
      const decorated = await this.dispatchService.decorateVehicleWithRuntimeState(vehicle);
      return {
        success: true,
        message: 'Vehicle updated successfully',
        data: decorated,
      };
    } catch (error) {
      this.logger.error(`Update vehicle failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: "Mashinani o'chirish" })
  @ApiResponse({ status: 200, description: "Mashina o'chirildi" })
  async deleteVehicle(@Param('id') id: string) {
    try {
      await this.vehiclesService.deleteVehicle(id);
      return {
        success: true,
        message: 'Vehicle deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Delete vehicle failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
