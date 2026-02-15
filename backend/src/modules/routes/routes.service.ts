import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Route } from './entities/route.entity';
import axios from 'axios';

interface Location {
  lat: number;
  lon: number;
  binId?: string;
}

@Injectable()
export class RoutesService {
  private readonly logger = new Logger(RoutesService.name);

  constructor(
    @InjectRepository(Route)
    private routeRepository: Repository<Route>,
  ) {}

  // Haversine formula - ikki nuqta orasidagi masofa (km)
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

  // Nearest Neighbor Algorithm - eng yaqin qutidan boshlash
  private findOptimalOrder(start: Location, bins: Location[]): Location[] {
    const ordered: Location[] = [];
    const remaining = [...bins];
    let current = start;

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = this.calculateDistance(
        current.lat, current.lon,
        remaining[0].lat, remaining[0].lon
      );

      for (let i = 1; i < remaining.length; i++) {
        const distance = this.calculateDistance(
          current.lat, current.lon,
          remaining[i].lat, remaining[i].lon
        );
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      const nearest = remaining.splice(nearestIndex, 1)[0];
      ordered.push(nearest);
      current = nearest;
    }

    return ordered;
  }

  // OSRM API dan marshrut olish
  private async fetchRouteFromOSRM(locations: Location[]): Promise<any> {
    try {
      // OSRM format: lon,lat;lon,lat;...
      const coordinates = locations
        .map(loc => `${loc.lon},${loc.lat}`)
        .join(';');

      const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
      
      this.logger.log(`🗺️ OSRM API: ${locations.length} nuqta uchun marshrut hisoblanmoqda...`);
      
      const response = await axios.get(url);
      const data = response.data;

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates_result = route.geometry.coordinates;
        
        // GeoJSON [lon, lat] dan [lat, lon] ga o'zgartirish
        const leafletCoordinates = coordinates_result.map((coord: number[]) => [coord[1], coord[0]]);
        
        const distanceKm = (route.distance / 1000).toFixed(2);
        const durationMin = Math.round(route.duration / 60);
        
        this.logger.log(`✅ Marshrut topildi: ${distanceKm} km, ${durationMin} daqiqa`);
        
        return {
          success: true,
          path: leafletCoordinates,
          distance: parseFloat(distanceKm),
          duration: durationMin
        };
      }
      
      return { success: false };
    } catch (error) {
      this.logger.error(`❌ OSRM API xatolik: ${error.message}`);
      return { success: false };
    }
  }

  // Optimal marshrut yaratish (TSP yechimi)
  async optimizeRoute(data: {
    vehicleId: string;
    startLat: number;
    startLon: number;
    bins: Array<{ binId: string; lat: number; lon: number }>;
  }): Promise<any> {
    try {
      this.logger.log(`🚛 Marshrut optimallashtirish: ${data.bins.length} ta quti`);

      if (data.bins.length === 0) {
        return {
          success: false,
          message: 'Qutilar ro\'yxati bo\'sh'
        };
      }

      // 1. Eng yaqin qutidan boshlash (Nearest Neighbor)
      const start: Location = { lat: data.startLat, lon: data.startLon };
      const bins: Location[] = data.bins.map(b => ({
        lat: b.lat,
        lon: b.lon,
        binId: b.binId
      }));

      const orderedBins = this.findOptimalOrder(start, bins);
      
      this.logger.log(`📊 Optimal tartib: ${orderedBins.map(b => b.binId).join(' → ')}`);

      // 2. OSRM dan real marshrut olish
      const allLocations = [start, ...orderedBins];
      const routeResult = await this.fetchRouteFromOSRM(allLocations);

      let routePath: number[][];
      let totalDistance: number;
      let estimatedDuration: number;

      if (routeResult.success) {
        routePath = routeResult.path;
        totalDistance = routeResult.distance;
        estimatedDuration = routeResult.duration;
      } else {
        // Backup: oddiy chiziqli marshrut
        routePath = allLocations.map(loc => [loc.lat, loc.lon]);
        totalDistance = 0;
        for (let i = 0; i < allLocations.length - 1; i++) {
          totalDistance += this.calculateDistance(
            allLocations[i].lat,
            allLocations[i].lon,
            allLocations[i + 1].lat,
            allLocations[i + 1].lon
          );
        }
        estimatedDuration = Math.round(totalDistance * 2); // 30 km/h o'rtacha tezlik
      }

      // 3. Marshrut ma'lumotini saqlash
      const binIdsList = orderedBins.map(b => b.binId).filter((id): id is string => id !== undefined);
      
      const route = this.routeRepository.create({
        vehicleId: data.vehicleId,
        binIds: binIdsList,
        startLatitude: data.startLat,
        startLongitude: data.startLon,
        routePath: JSON.stringify(routePath),
        totalDistance: totalDistance,
        estimatedDuration: estimatedDuration,
        status: 'pending'
      });

      const saved = await this.routeRepository.save(route);

      this.logger.log(`✅ Optimal marshrut yaratildi: ${totalDistance.toFixed(2)} km, ${estimatedDuration} daqiqa`);

      return {
        success: true,
        data: {
          routeId: saved.id,
          orderedBins: binIdsList,
          routePath: routePath,
          totalDistance: totalDistance,
          estimatedDuration: estimatedDuration,
          status: 'pending'
        }
      };
    } catch (error) {
      this.logger.error(`❌ Marshrut optimallashtirish xatolik: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Ikki nuqta orasidagi marshrut
  async calculateRoute(data: {
    startLat: number;
    startLon: number;
    endLat: number;
    endLon: number;
  }): Promise<any> {
    try {
      this.logger.log(`📍 Marshrut hisoblash: [${data.startLat}, ${data.startLon}] → [${data.endLat}, ${data.endLon}]`);

      const locations: Location[] = [
        { lat: data.startLat, lon: data.startLon },
        { lat: data.endLat, lon: data.endLon }
      ];

      const routeResult = await this.fetchRouteFromOSRM(locations);

      if (routeResult.success) {
        return {
          success: true,
          data: {
            routePath: routeResult.path,
            distance: routeResult.distance,
            duration: routeResult.duration
          }
        };
      }

      // Backup: to'g'ri chiziq
      const distance = this.calculateDistance(
        data.startLat, data.startLon,
        data.endLat, data.endLon
      );

      return {
        success: true,
        data: {
          routePath: [[data.startLat, data.startLon], [data.endLat, data.endLon]],
          distance: distance,
          duration: Math.round(distance * 2)
        }
      };
    } catch (error) {
      this.logger.error(`❌ Marshrut hisoblash xatolik: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Marshrut tarixini olish
  async getRouteHistory(vehicleId: string, limit: number = 20): Promise<Route[]> {
    try {
      const routes = await this.routeRepository.find({
        where: { vehicleId },
        order: { createdAt: 'DESC' },
        take: limit
      });

      this.logger.log(`📜 ${vehicleId} uchun ${routes.length} ta marshrut topildi`);
      return routes;
    } catch (error) {
      this.logger.error(`❌ Marshrut tarixi xatolik: ${error.message}`);
      return [];
    }
  }

  // Marshrut holatini yangilash
  async updateRouteStatus(routeId: string, status: string): Promise<any> {
    try {
      const route = await this.routeRepository.findOne({ where: { id: routeId } });
      
      if (!route) {
        return { success: false, message: 'Marshrut topilmadi' };
      }

      route.status = status;

      if (status === 'in-progress' && !route.startedAt) {
        route.startedAt = new Date();
      }

      if (status === 'completed' && !route.completedAt) {
        route.completedAt = new Date();
      }

      await this.routeRepository.save(route);

      this.logger.log(`✅ Marshrut holati yangilandi: ${routeId} → ${status}`);
      return { success: true, data: route };
    } catch (error) {
      this.logger.error(`❌ Marshrut holati yangilash xatolik: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Marshrut ma'lumotini olish
  async getRoute(routeId: string): Promise<any> {
    try {
      const route = await this.routeRepository.findOne({ where: { id: routeId } });
      
      if (!route) {
        return { success: false, message: 'Marshrut topilmadi' };
      }

      return {
        success: true,
        data: {
          ...route,
          routePath: JSON.parse(route.routePath)
        }
      };
    } catch (error) {
      this.logger.error(`❌ Marshrut olish xatolik: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
