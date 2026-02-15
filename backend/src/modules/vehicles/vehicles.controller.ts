import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@ApiTags('Vehicles')
@Controller('vehicles')
export class VehiclesController {
  private readonly logger = new Logger(VehiclesController.name);

  constructor(private readonly vehiclesService: VehiclesService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new vehicle' })
  @ApiResponse({ status: 201, description: 'Vehicle created successfully' })
  async create(@Body() createVehicleDto: CreateVehicleDto) {
    try {
      this.logger.log(`🚛 Creating new vehicle: ${createVehicleDto.licensePlate}`);
      this.logger.debug(`📝 Vehicle data: ${JSON.stringify(createVehicleDto)}`);

      const result = await this.vehiclesService.create(createVehicleDto);

      this.logger.log(`✅ Vehicle created successfully: ${createVehicleDto.licensePlate}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Error creating vehicle ${createVehicleDto.licensePlate}: ${error.message}`);
      this.logger.debug(`🔍 Error details: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all vehicles with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    try {
      const queryParams = { page, limit, status, type };
      // this.logger.log(`🔍 Getting vehicles with query: ${JSON.stringify(queryParams)}`);

      const result = await this.vehiclesService.findAll(queryParams);

      // this.logger.log(`✅ Retrieved ${result.data.length} vehicles (total: ${result.pagination.total})`);
      // this.logger.debug(`📊 Pagination: page ${result.pagination.page}/${result.pagination.totalPages}`);

      return result;
    } catch (error) {
      this.logger.error(`❌ Error getting vehicles: ${error.message}`);
      this.logger.debug(`🔍 Error details: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get vehicle statistics' })
  async getStatistics() {
    try {
      this.logger.log(`📊 Getting vehicle statistics`);

      const result = await this.vehiclesService.getStatistics();

      this.logger.log(`✅ Vehicle statistics retrieved successfully`);
      this.logger.debug(`📈 Stats: ${JSON.stringify(result.data)}`);

      return result;
    } catch (error) {
      this.logger.error(`❌ Error getting vehicle statistics: ${error.message}`);
      this.logger.debug(`🔍 Error details: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update vehicle' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  @Patch(':id/location')
  @ApiOperation({ summary: 'Update vehicle location' })
  updateLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    return this.vehiclesService.updateLocation(id, updateLocationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete vehicle' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.remove(id);
  }
}