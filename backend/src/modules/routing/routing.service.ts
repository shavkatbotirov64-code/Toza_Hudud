import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface RouteResult {
  success: boolean;
  path: [number, number][];
  distance?: string;
  duration?: string;
  error?: string;
}

@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);
  private readonly OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';
  private readonly TIMEOUT = 30000; // 30 soniya
  private readonly MAX_RETRIES = 3;
  
  // Samarqand chegaralari
  private readonly SAMARQAND_BOUNDS = {
    north: 39.70,
    south: 39.62,
    east: 67.00,
    west: 66.92
  };

  /**
   * OSRM API orqali marshrut olish (retry mexanizmi bilan)
   */
  async getRoute(
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number
  ): Promise<RouteResult> {
    // Pozitsiyalarni Samarqand chegarasida ekanligini tekshirish
    if (!this.isWithinSamarqand(startLat, startLon) || !this.isWithinSamarqand(endLat, endLon)) {
      this.logger.warn('⚠️ Pozitsiyalar Samarqand tashqarisida, constraining...');
      [startLat, startLon] = this.constrainToSamarqand(startLat, startLon);
      [endLat, endLon] = this.constrainToSamarqand(endLat, endLon);
    }

    const url = `${this.OSRM_BASE_URL}/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson&continue_straight=true`;

    this.logger.log(`🗺️ OSRM: Marshrut hisoblanmoqda...`);
    this.logger.log(`📍 Start: [${startLat}, ${startLon}]`);
    this.logger.log(`📍 End: [${endLat}, ${endLon}]`);

    // Retry mexanizmi
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        this.logger.log(`🔄 Urinish ${attempt + 1}/${this.MAX_RETRIES}...`);

        const response = await axios.get(url, {
          timeout: this.TIMEOUT,
          headers: {
            'Accept': 'application/json'
          }
        });

        this.logger.log(`📡 OSRM Response status: ${response.status}`);

        if (response.data.code === 'Ok' && response.data.routes && response.data.routes.length > 0) {
          const route = response.data.routes[0];
          const coordinates = route.geometry.coordinates;

          // GeoJSON format [lon, lat] dan [lat, lon] ga o'zgartirish
          const path: [number, number][] = coordinates.map(coord => [coord[1], coord[0]]);

          const distanceKm = (route.distance / 1000).toFixed(2);
          const durationMin = (route.duration / 60).toFixed(1);

          this.logger.log(`✅ OSRM marshrut topildi!`);
          this.logger.log(`📏 Masofa: ${distanceKm} km`);
          this.logger.log(`⏱️ Vaqt: ${durationMin} daqiqa`);
          this.logger.log(`📊 Nuqtalar: ${path.length}`);

          return {
            success: true,
            path,
            distance: `${distanceKm} km`,
            duration: `${durationMin} daqiqa`
          };
        } else {
          this.logger.warn(`⚠️ OSRM: Marshrut topilmadi (code: ${response.data.code})`);
          if (attempt < this.MAX_RETRIES - 1) {
            this.logger.log(`⏳ 2 soniya kutib, qayta urinilmoqda...`);
            await this.sleep(2000);
            continue;
          }
        }
      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          this.logger.warn(`⚠️ OSRM API timeout (30s) - urinish ${attempt + 1}/${this.MAX_RETRIES}`);
        } else {
          this.logger.warn(`⚠️ OSRM API xatolik: ${error.message}`);
        }

        if (attempt < this.MAX_RETRIES - 1) {
          this.logger.log(`⏳ 2 soniya kutib, qayta urinilmoqda...`);
          await this.sleep(2000);
          continue;
        }
      }
    }

    // Barcha urinishlar muvaffaqiyatsiz - to'g'ri chiziq interpolatsiya
    this.logger.warn('❌ OSRM barcha urinishlar muvaffaqiyatsiz, to\'g\'ri chiziq interpolatsiya');
    const interpolatedPath = this.interpolatePath(startLat, startLon, endLat, endLon, 10);

    return {
      success: false,
      path: interpolatedPath,
      error: 'OSRM unavailable, using straight line interpolation'
    };
  }

  /**
   * To'g'ri chiziq interpolatsiya (fallback)
   */
  private interpolatePath(
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number,
    points: number
  ): [number, number][] {
    const path: [number, number][] = [];
    for (let i = 0; i <= points; i++) {
      const t = i / points;
      const lat = startLat + (endLat - startLat) * t;
      const lon = startLon + (endLon - startLon) * t;
      path.push([lat, lon]);
    }
    return path;
  }

  /**
   * Pozitsiya Samarqand ichida ekanligini tekshirish
   */
  private isWithinSamarqand(lat: number, lon: number): boolean {
    return lat >= this.SAMARQAND_BOUNDS.south &&
           lat <= this.SAMARQAND_BOUNDS.north &&
           lon >= this.SAMARQAND_BOUNDS.west &&
           lon <= this.SAMARQAND_BOUNDS.east;
  }

  /**
   * Pozitsiyani Samarqand chegarasiga qaytarish
   */
  private constrainToSamarqand(lat: number, lon: number): [number, number] {
    const constrainedLat = Math.max(
      this.SAMARQAND_BOUNDS.south,
      Math.min(this.SAMARQAND_BOUNDS.north, lat)
    );
    const constrainedLon = Math.max(
      this.SAMARQAND_BOUNDS.west,
      Math.min(this.SAMARQAND_BOUNDS.east, lon)
    );
    return [constrainedLat, constrainedLon];
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
