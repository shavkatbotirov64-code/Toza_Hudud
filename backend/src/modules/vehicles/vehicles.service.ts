import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  // Mashina yaratish yoki yangilash
  async upsertVehicle(data: {
    vehicleId: string;
    driver: string;
    latitude: number;
    longitude: number;
    status?: string;
  }): Promise<Vehicle> {
    try {
      let vehicle = await this.vehicleRepository.findOne({
        where: { vehicleId: data.vehicleId },
      });

      if (vehicle) {
        // Yangilash
        vehicle.driver = data.driver;
        vehicle.latitude = data.latitude;
        vehicle.longitude = data.longitude;
        vehicle.status = data.status || vehicle.status;
      } else {
        // Yaratish
        vehicle = this.vehicleRepository.create({
          vehicleId: data.vehicleId,
          driver: data.driver,
          latitude: data.latitude,
          longitude: data.longitude,
          status: data.status || 'idle',
        });
      }

      const saved = await this.vehicleRepository.save(vehicle);
      this.logger.log(`🚛 Vehicle saved: ${saved.vehicleId} at [${saved.latitude}, ${saved.longitude}]`);
      return saved;
    } catch (error) {
      this.logger.error(`❌ Error saving vehicle: ${error.message}`);
      throw error;
    }
  }

  // Mashina holatini olish
  async getVehicleStatus(vehicleId: string): Promise<Vehicle> {
    try {
      const vehicle = await this.vehicleRepository.findOne({
        where: { vehicleId },
      });

      if (!vehicle) {
        throw new NotFoundException(`Vehicle ${vehicleId} not found`);
      }

      return vehicle;
    } catch (error) {
      this.logger.error(`❌ Error getting vehicle status: ${error.message}`);
      throw error;
    }
  }

  // Barcha mashinalar
  async getAllVehicles(): Promise<Vehicle[]> {
    try {
      const vehicles = await this.vehicleRepository.find({
        order: { updatedAt: 'DESC' },
      });
      return vehicles;
    } catch (error) {
      this.logger.error(`❌ Error getting all vehicles: ${error.message}`);
      return [];
    }
  }

  // Mashina lokatsiyasini yangilash
  async updateLocation(
    vehicleId: string,
    latitude: number,
    longitude: number,
  ): Promise<Vehicle> {
    try {
      const vehicle = await this.getVehicleStatus(vehicleId);
      
      vehicle.latitude = latitude;
      vehicle.longitude = longitude;
      vehicle.updatedAt = new Date();

      const saved = await this.vehicleRepository.save(vehicle);
      this.logger.log(`📍 Vehicle location updated: ${vehicleId} → [${latitude}, ${longitude}]`);
      return saved;
    } catch (error) {
      this.logger.error(`❌ Error updating location: ${error.message}`);
      throw error;
    }
  }

  // Mashina holatini yangilash
  async updateState(
    vehicleId: string,
    data: {
      isPatrolling?: boolean;
      hasCleanedOnce?: boolean;
      patrolIndex?: number;
      status?: string;
      patrolRoute?: any;
      currentRoute?: any;
    },
  ): Promise<Vehicle> {
    try {
      const vehicle = await this.getVehicleStatus(vehicleId);
      
      if (data.isPatrolling !== undefined) vehicle.isPatrolling = data.isPatrolling;
      if (data.hasCleanedOnce !== undefined) vehicle.hasCleanedOnce = data.hasCleanedOnce;
      if (data.patrolIndex !== undefined) vehicle.patrolIndex = data.patrolIndex;
      if (data.status !== undefined) vehicle.status = data.status;
      if (data.patrolRoute !== undefined) vehicle.patrolRoute = data.patrolRoute;
      if (data.currentRoute !== undefined) vehicle.currentRoute = data.currentRoute;
      
      vehicle.updatedAt = new Date();

      const saved = await this.vehicleRepository.save(vehicle);
      this.logger.log(`🔄 Vehicle state updated: ${vehicleId}`);
      return saved;
    } catch (error) {
      this.logger.error(`❌ Error updating state: ${error.message}`);
      throw error;
    }
  }

  // Mashina harakatini boshlash
  async startMoving(vehicleId: string, targetBinId: string): Promise<Vehicle> {
    try {
      const vehicle = await this.getVehicleStatus(vehicleId);
      
      vehicle.isMoving = true;
      vehicle.status = 'moving';
      vehicle.targetBinId = targetBinId;

      const saved = await this.vehicleRepository.save(vehicle);
      this.logger.log(`🚛 Vehicle started moving: ${vehicleId} → ${targetBinId}`);
      return saved;
    } catch (error) {
      this.logger.error(`❌ Error starting movement: ${error.message}`);
      throw error;
    }
  }

  // Mashina to'xtadi
  async stopMoving(vehicleId: string): Promise<Vehicle> {
    try {
      const vehicle = await this.getVehicleStatus(vehicleId);
      
      vehicle.isMoving = false;
      vehicle.status = 'idle';
      vehicle.targetBinId = null;

      const saved = await this.vehicleRepository.save(vehicle);
      this.logger.log(`🛑 Vehicle stopped: ${vehicleId}`);
      return saved;
    } catch (error) {
      this.logger.error(`❌ Error stopping vehicle: ${error.message}`);
      throw error;
    }
  }

  // Tozalash tugadi
  async completeCleaning(vehicleId: string): Promise<Vehicle> {
    try {
      const vehicle = await this.getVehicleStatus(vehicleId);
      
      vehicle.lastCleaningTime = new Date();
      vehicle.totalCleanings += 1;
      vehicle.isMoving = false;
      vehicle.status = 'idle';
      vehicle.targetBinId = null;

      const saved = await this.vehicleRepository.save(vehicle);
      this.logger.log(`🧹 Cleaning completed: ${vehicleId} (Total: ${saved.totalCleanings})`);
      return saved;
    } catch (error) {
      this.logger.error(`❌ Error completing cleaning: ${error.message}`);
      throw error;
    }
  }

  // Bosib o'tgan masofani qo'shish
  async addDistance(vehicleId: string, distanceKm: number): Promise<Vehicle> {
    try {
      const vehicle = await this.getVehicleStatus(vehicleId);
      
      vehicle.totalDistanceTraveled = Number(vehicle.totalDistanceTraveled) + distanceKm;

      const saved = await this.vehicleRepository.save(vehicle);
      this.logger.log(`📏 Distance added: ${vehicleId} +${distanceKm}km (Total: ${saved.totalDistanceTraveled}km)`);
      return saved;
    } catch (error) {
      this.logger.error(`❌ Error adding distance: ${error.message}`);
      throw error;
    }
  }

  // CRUD Operations

  // Yangi mashina qo'shish
  async createVehicle(data: {
    vehicleId: string;
    driver: string;
    phone?: string;
    licensePlate?: string;
    latitude: number;
    longitude: number;
  }): Promise<Vehicle> {
    try {
      // Mavjudligini tekshirish
      const existing = await this.vehicleRepository.findOne({
        where: { vehicleId: data.vehicleId },
      });

      if (existing) {
        throw new Error(`Vehicle ${data.vehicleId} already exists`);
      }

      const vehicle = this.vehicleRepository.create({
        vehicleId: data.vehicleId,
        driver: data.driver,
        latitude: data.latitude,
        longitude: data.longitude,
        status: 'idle',
        isMoving: false,
      });

      const saved = await this.vehicleRepository.save(vehicle);
      this.logger.log(`✅ Vehicle created: ${saved.vehicleId}`);
      return saved;
    } catch (error) {
      this.logger.error(`❌ Error creating vehicle: ${error.message}`);
      throw error;
    }
  }

  // Mashinani yangilash
  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    try {
      const vehicle = await this.vehicleRepository.findOne({ where: { id } });

      if (!vehicle) {
        throw new NotFoundException(`Vehicle with ID ${id} not found`);
      }

      Object.assign(vehicle, data);
      const saved = await this.vehicleRepository.save(vehicle);
      this.logger.log(`✅ Vehicle updated: ${saved.vehicleId}`);
      return saved;
    } catch (error) {
      this.logger.error(`❌ Error updating vehicle: ${error.message}`);
      throw error;
    }
  }

  // Mashinani o'chirish
  async deleteVehicle(id: string): Promise<void> {
    try {
      const vehicle = await this.vehicleRepository.findOne({ where: { id } });

      if (!vehicle) {
        throw new NotFoundException(`Vehicle with ID ${id} not found`);
      }

      await this.vehicleRepository.remove(vehicle);
      this.logger.log(`✅ Vehicle deleted: ${vehicle.vehicleId}`);
    } catch (error) {
      this.logger.error(`❌ Error deleting vehicle: ${error.message}`);
      throw error;
    }
  }
}
