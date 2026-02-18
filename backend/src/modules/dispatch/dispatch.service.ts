import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bin } from '../sensors/entities/bin.entity';
import { Dispatch } from './entities/dispatch.entity';

interface Vehicle {
  id: string;
  vehicleId: string;
  driverName: string;
  currentLatitude: string;
  currentLongitude: string;
  isMoving: boolean;
  status: string;
}

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(
    @InjectRepository(Bin)
    private binRepository: Repository<Bin>,
    @InjectRepository(Dispatch)
    private dispatchRepository: Repository<Dispatch>,
  ) {}

  // Calculate distance between two points (Haversine formula)
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Find closest vehicle to a bin
  async findClosestVehicle(binId: string, vehicles: Vehicle[]) {
    try {
      // Get bin location
      const bin = await this.binRepository.findOne({
        where: [{ id: binId }, { code: binId }],
      });

      if (!bin) {
        this.logger.error(`❌ Bin not found: ${binId}`);
        return {
          success: false,
          error: 'Bin not found',
        };
      }

      this.logger.log(`📍 Bin location: [${bin.latitude}, ${bin.longitude}]`);

      // Filter patrolling vehicles (not moving to bin)
      const patrollingVehicles = vehicles.filter(
        (v) => !v.isMoving || v.status === 'idle',
      );

      if (patrollingVehicles.length === 0) {
        this.logger.warn('⚠️ No patrolling vehicles available');
        return {
          success: false,
          error: 'No patrolling vehicles available',
        };
      }

      this.logger.log(
        `🚛 Found ${patrollingVehicles.length} patrolling vehicles`,
      );

      // Calculate distances
      const distances = patrollingVehicles.map((vehicle) => {
        const distance = this.calculateDistance(
          parseFloat(vehicle.currentLatitude),
          parseFloat(vehicle.currentLongitude),
          parseFloat(bin.latitude),
          parseFloat(bin.longitude),
        );

        return {
          vehicle,
          distance,
        };
      });

      // Find closest
      const closest = distances.reduce((prev, curr) =>
        curr.distance < prev.distance ? curr : prev,
      );

      this.logger.log(
        `✅ Closest vehicle: ${closest.vehicle.vehicleId} (${closest.distance.toFixed(2)} km)`,
      );

      return {
        success: true,
        data: {
          vehicle: closest.vehicle,
          distance: closest.distance,
          bin: {
            id: bin.id,
            code: bin.code,
            location: {
              latitude: parseFloat(bin.latitude),
              longitude: parseFloat(bin.longitude),
            },
            address: bin.address,
          },
        },
      };
    } catch (error) {
      this.logger.error(`❌ Error finding closest vehicle: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Dispatch vehicle to bin
  async dispatchVehicleToBin(binId: string, vehicles: Vehicle[]) {
    try {
      const result = await this.findClosestVehicle(binId, vehicles);

      if (!result.success) {
        return result;
      }

      const { vehicle, distance, bin } = result.data;

      this.logger.log(
        `🚀 Dispatching ${vehicle.vehicleId} to bin ${bin.code}`,
      );

      // Create dispatch record
      const dispatch = this.dispatchRepository.create({
        vehicleId: vehicle.vehicleId,
        binId: bin.id,
        binAddress: bin.address,
        distance: distance,
        estimatedTime: Math.round((distance / 30) * 60), // 30 km/h
        priority: 'medium',
        status: 'pending',
      });

      const savedDispatch = await this.dispatchRepository.save(dispatch);
      this.logger.log(`📝 Dispatch record created: ${savedDispatch.id}`);

      // Return dispatch information
      return {
        success: true,
        data: {
          dispatchId: savedDispatch.id,
          vehicleId: vehicle.vehicleId,
          vehicleName: vehicle.driverName,
          binId: bin.id,
          binCode: bin.code,
          binAddress: bin.address,
          distance: distance.toFixed(2),
          estimatedTime: Math.round((distance / 30) * 60),
          route: {
            start: {
              latitude: parseFloat(vehicle.currentLatitude),
              longitude: parseFloat(vehicle.currentLongitude),
            },
            end: {
              latitude: bin.location.latitude,
              longitude: bin.location.longitude,
            },
          },
        },
      };
    } catch (error) {
      this.logger.error(`❌ Error dispatching vehicle: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ✨ YANGI: Dispatch tarixi
  async getDispatchHistory(limit: number = 50) {
    try {
      const dispatches = await this.dispatchRepository.find({
        order: { createdAt: 'DESC' },
        take: limit,
      });

      this.logger.log(`📋 Retrieved ${dispatches.length} dispatch records`);

      return {
        success: true,
        data: dispatches,
      };
    } catch (error) {
      this.logger.error(`❌ Error getting dispatch history: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ✨ YANGI: Qo'lda dispatch yaratish
  async createDispatch(data: {
    vehicleId: string;
    binId: string;
    priority?: string;
    notes?: string;
  }) {
    try {
      const dispatch = this.dispatchRepository.create({
        vehicleId: data.vehicleId,
        binId: data.binId,
        priority: data.priority || 'medium',
        status: 'pending',
        notes: data.notes,
      });

      const saved = await this.dispatchRepository.save(dispatch);
      this.logger.log(`📝 Manual dispatch created: ${saved.id}`);

      return {
        success: true,
        data: saved,
      };
    } catch (error) {
      this.logger.error(`❌ Error creating dispatch: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ✨ YANGI: Dispatch holatini yangilash
  async updateDispatchStatus(
    dispatchId: string,
    status: string,
    notes?: string,
  ) {
    try {
      const dispatch = await this.dispatchRepository.findOne({
        where: { id: dispatchId },
      });

      if (!dispatch) {
        return {
          success: false,
          error: 'Dispatch not found',
        };
      }

      dispatch.status = status;
      if (notes) dispatch.notes = notes;

      if (status === 'in-progress' && !dispatch.startedAt) {
        dispatch.startedAt = new Date();
      }

      if (status === 'completed' && !dispatch.completedAt) {
        dispatch.completedAt = new Date();
      }

      const saved = await this.dispatchRepository.save(dispatch);
      this.logger.log(`✅ Dispatch ${dispatchId} status updated to ${status}`);

      return {
        success: true,
        data: saved,
      };
    } catch (error) {
      this.logger.error(`❌ Error updating dispatch: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ✨ YANGI: Mashina bo'yicha dispatch tarixi
  async getDispatchesByVehicle(vehicleId: string, limit: number = 20) {
    try {
      const dispatches = await this.dispatchRepository.find({
        where: { vehicleId },
        order: { createdAt: 'DESC' },
        take: limit,
      });

      this.logger.log(`🚛 Retrieved ${dispatches.length} dispatches for ${vehicleId}`);

      return {
        success: true,
        data: dispatches,
      };
    } catch (error) {
      this.logger.error(`❌ Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ✨ YANGI: Quti bo'yicha dispatch tarixi
  async getDispatchesByBin(binId: string, limit: number = 20) {
    try {
      const dispatches = await this.dispatchRepository.find({
        where: { binId },
        order: { createdAt: 'DESC' },
        take: limit,
      });

      this.logger.log(`🗑️ Retrieved ${dispatches.length} dispatches for bin ${binId}`);

      return {
        success: true,
        data: dispatches,
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
