import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bin } from '../sensors/entities/bin.entity';

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

      // Return dispatch information
      return {
        success: true,
        data: {
          vehicleId: vehicle.vehicleId,
          vehicleName: vehicle.driverName,
          binId: bin.id,
          binCode: bin.code,
          binAddress: bin.address,
          distance: distance.toFixed(2),
          estimatedTime: Math.round((distance / 30) * 60), // Assuming 30 km/h average speed
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
}
