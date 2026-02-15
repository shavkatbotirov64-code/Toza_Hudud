import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle, VehicleStatus } from './entities/vehicle.entity';
import { VehicleHistory, VehicleHistoryAction } from './entities/vehicle-history.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(VehicleHistory)
    private vehicleHistoryRepository: Repository<VehicleHistory>,
  ) {}

  async create(createVehicleDto: CreateVehicleDto) {
    // Check if vehicle code already exists
    const existingVehicle = await this.vehicleRepository.findOne({
      where: { code: createVehicleDto.code },
    });

    if (existingVehicle) {
      throw new NotFoundException(`Vehicle with code ${createVehicleDto.code} already exists`);
    }

    const vehicle = this.vehicleRepository.create(createVehicleDto);
    const savedVehicle = await this.vehicleRepository.save(vehicle);

    // Create history record
    await this.vehicleHistoryRepository.save({
      vehicleId: savedVehicle.id,
      action: VehicleHistoryAction.STATUS_CHANGE,
      description: 'Vehicle created and registered',
      metadata: { status: savedVehicle.status },
      performedBy: 'system',
    });

    return {
      success: true,
      message: 'Vehicle created successfully',
      data: savedVehicle,
    };
  }

  async findAll(filters: any = {}) {
    const { page = 1, limit = 10, status, type } = filters;
    const skip = (page - 1) * limit;

    const queryBuilder = this.vehicleRepository.createQueryBuilder('vehicle');

    if (status) {
      queryBuilder.andWhere('vehicle.status = :status', { status });
    }

    if (type) {
      queryBuilder.andWhere('vehicle.type = :type', { type });
    }

    const [vehicles, total] = await queryBuilder
      .orderBy('vehicle.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      success: true,
      message: 'Vehicles retrieved successfully',
      data: vehicles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStatistics() {
    const totalVehicles = await this.vehicleRepository.count();
    const activeVehicles = await this.vehicleRepository.count({
      where: { status: VehicleStatus.ACTIVE },
    });
    const movingVehicles = await this.vehicleRepository.count({
      where: { status: VehicleStatus.MOVING },
    });

    const statusDistribution = await this.vehicleRepository
      .createQueryBuilder('vehicle')
      .select('vehicle.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('vehicle.status')
      .getRawMany();

    const typeDistribution = await this.vehicleRepository
      .createQueryBuilder('vehicle')
      .select('vehicle.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('vehicle.type')
      .getRawMany();

    const averageFuelLevel = await this.vehicleRepository
      .createQueryBuilder('vehicle')
      .select('AVG(vehicle.fuelLevel)', 'avgFuelLevel')
      .getRawOne();

    return {
      success: true,
      message: 'Statistics retrieved successfully',
      data: {
        totalVehicles,
        activeVehicles,
        movingVehicles,
        statusDistribution,
        typeDistribution,
        averageFuelLevel: parseFloat(averageFuelLevel.avgFuelLevel) || 0,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async findOne(id: string) {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    return {
      success: true,
      message: 'Vehicle retrieved successfully',
      data: vehicle,
    };
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto) {
    const vehicle = await this.vehicleRepository.findOne({ where: { id } });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    const updatedVehicle = await this.vehicleRepository.save({
      ...vehicle,
      ...updateVehicleDto,
      updatedAt: new Date(),
    });

    // Create history record for significant changes
    if (updateVehicleDto.status && updateVehicleDto.status !== vehicle.status) {
      await this.vehicleHistoryRepository.save({
        vehicleId: id,
        action: VehicleHistoryAction.STATUS_CHANGE,
        description: `Status changed from ${vehicle.status} to ${updateVehicleDto.status}`,
        metadata: { 
          oldStatus: vehicle.status, 
          newStatus: updateVehicleDto.status 
        },
        performedBy: 'system',
      });
    }

    return {
      success: true,
      message: 'Vehicle updated successfully',
      data: updatedVehicle,
    };
  }

  async updateLocation(id: string, updateLocationDto: UpdateLocationDto) {
    const vehicle = await this.vehicleRepository.findOne({ where: { id } });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    const updatedVehicle = await this.vehicleRepository.save({
      ...vehicle,
      currentLatitude: updateLocationDto.latitude,
      currentLongitude: updateLocationDto.longitude,
      currentSpeed: updateLocationDto.speed || vehicle.currentSpeed,
      lastLocationUpdate: new Date(),
      updatedAt: new Date(),
    });

    // Create history record
    await this.vehicleHistoryRepository.save({
      vehicleId: id,
      action: VehicleHistoryAction.LOCATION_UPDATE,
      description: `Location updated to ${updateLocationDto.latitude}, ${updateLocationDto.longitude}`,
      metadata: {
        latitude: updateLocationDto.latitude,
        longitude: updateLocationDto.longitude,
        speed: updateLocationDto.speed,
      },
      performedBy: 'gps_system',
    });

    return {
      success: true,
      message: 'Vehicle location updated successfully',
      data: updatedVehicle,
    };
  }

  async remove(id: string) {
    const vehicle = await this.vehicleRepository.findOne({ where: { id } });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    await this.vehicleRepository.remove(vehicle);

    return {
      success: true,
      message: 'Vehicle deleted successfully',
    };
  }
}