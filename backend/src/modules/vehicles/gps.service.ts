import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { GpsLocation } from './entities/gps-location.entity';
import { Vehicle } from './entities/vehicle.entity';

@Injectable()
export class GpsService {
  private readonly logger = new Logger(GpsService.name);

  constructor(
    @InjectRepository(GpsLocation)
    private gpsRepository: Repository<GpsLocation>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  // GPS koordinatalarini saqlash
  async saveGpsLocation(data: {
    vehicleId: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    altitude?: number;
    accuracy?: number;
    timestamp?: Date;
  }): Promise<any> {
    try {
      // GPS ma'lumotini saqlash
      const gpsLocation = this.gpsRepository.create({
        vehicleId: data.vehicleId,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed,
        heading: data.heading,
        altitude: data.altitude,
        accuracy: data.accuracy,
        timestamp: data.timestamp || new Date(),
      });

      const saved = await this.gpsRepository.save(gpsLocation);

      // Vehicle entity ni yangilash
      const vehicle = await this.vehicleRepository.findOne({
        where: { vehicleId: data.vehicleId }
      });

      if (vehicle) {
        vehicle.latitude = data.latitude;
        vehicle.longitude = data.longitude;
        await this.vehicleRepository.save(vehicle);
      }

      this.logger.log(`📍 GPS saqlandi: ${data.vehicleId} [${data.latitude}, ${data.longitude}]`);

      return {
        success: true,
        data: saved
      };
    } catch (error) {
      this.logger.error(`❌ GPS saqlash xatolik: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Mashina hozirgi pozitsiyasini olish
  async getCurrentLocation(vehicleId: string): Promise<any> {
    try {
      const location = await this.gpsRepository.findOne({
        where: { vehicleId },
        order: { timestamp: 'DESC' }
      });

      if (!location) {
        return {
          success: false,
          message: 'GPS ma\'lumot topilmadi'
        };
      }

      this.logger.log(`📍 Hozirgi pozitsiya: ${vehicleId} [${location.latitude}, ${location.longitude}]`);

      return {
        success: true,
        data: location
      };
    } catch (error) {
      this.logger.error(`❌ GPS olish xatolik: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // GPS tarixi (oxirgi N soat)
  async getGpsHistory(vehicleId: string, hours: number = 1): Promise<any> {
    try {
      const since = new Date();
      since.setHours(since.getHours() - hours);

      const locations = await this.gpsRepository.find({
        where: {
          vehicleId,
          timestamp: MoreThan(since)
        },
        order: { timestamp: 'ASC' }
      });

      this.logger.log(`📜 GPS tarixi: ${vehicleId} - ${locations.length} ta nuqta (oxirgi ${hours} soat)`);

      return {
        success: true,
        data: locations,
        count: locations.length
      };
    } catch (error) {
      this.logger.error(`❌ GPS tarixi xatolik: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Mashina harakatini kuzatish (real-time tracking)
  async trackVehicle(vehicleId: string, limit: number = 50): Promise<any> {
    try {
      const locations = await this.gpsRepository.find({
        where: { vehicleId },
        order: { timestamp: 'DESC' },
        take: limit
      });

      if (locations.length === 0) {
        return {
          success: false,
          message: 'GPS ma\'lumot topilmadi'
        };
      }

      // Oxirgi pozitsiya
      const current = locations[0];

      // Marshrut (teskari tartibda - eski dan yangiga)
      const route = locations.reverse().map(loc => ({
        lat: parseFloat(loc.latitude.toString()),
        lon: parseFloat(loc.longitude.toString()),
        speed: loc.speed,
        timestamp: loc.timestamp
      }));

      // Jami masofa hisoblash
      let totalDistance = 0;
      for (let i = 1; i < route.length; i++) {
        const dist = this.calculateDistance(
          route[i-1].lat, route[i-1].lon,
          route[i].lat, route[i].lon
        );
        totalDistance += dist;
      }

      // O'rtacha tezlik
      const avgSpeed = locations
        .filter(loc => loc.speed !== null)
        .reduce((sum, loc) => sum + parseFloat(loc.speed.toString()), 0) / 
        locations.filter(loc => loc.speed !== null).length || 0;

      this.logger.log(`🚛 Tracking: ${vehicleId} - ${route.length} nuqta, ${totalDistance.toFixed(2)} km`);

      return {
        success: true,
        data: {
          vehicleId,
          current: {
            latitude: current.latitude,
            longitude: current.longitude,
            speed: current.speed,
            heading: current.heading,
            timestamp: current.timestamp
          },
          route: route,
          stats: {
            totalPoints: route.length,
            totalDistance: parseFloat(totalDistance.toFixed(2)),
            averageSpeed: parseFloat(avgSpeed.toFixed(2)),
            startTime: route[0].timestamp,
            endTime: route[route.length - 1].timestamp
          }
        }
      };
    } catch (error) {
      this.logger.error(`❌ Tracking xatolik: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Haversine formula - ikki nuqta orasidagi masofa
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Yer radiusi (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Eski GPS ma'lumotlarini tozalash (30 kundan eski)
  async cleanOldGpsData(): Promise<any> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.gpsRepository
        .createQueryBuilder()
        .delete()
        .where('timestamp < :date', { date: thirtyDaysAgo })
        .execute();

      this.logger.log(`🧹 Eski GPS ma'lumotlar tozalandi: ${result.affected} ta yozuv`);

      return {
        success: true,
        deleted: result.affected
      };
    } catch (error) {
      this.logger.error(`❌ GPS tozalash xatolik: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
