import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SensorReading } from './entities/sensor-reading.entity';
import { SensorAlert } from './entities/sensor-alert.entity';
import { Bin } from './entities/bin.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { Route } from '../routes/entities/route.entity';
import { SensorsGateway } from './sensors.gateway';
import { RoutesService } from '../routes/routes.service';
import { CleaningsService } from '../cleanings/cleanings.service';
import { ActivitiesService } from '../activities/activities.service';

interface IncomingSensorPayload {
  distance: number;
  binId?: string;
  location?: string;
  timestamp?: string;
}

interface AssignmentOptions {
  excludeVehicleIds?: string[];
  trigger?: string;
}

@Injectable()
export class DispatchService implements OnModuleDestroy {
  private readonly logger = new Logger(DispatchService.name);

  private readonly FULL_DISTANCE_THRESHOLD_CM = 20;
  private readonly DEFAULT_BIN_ID = 'ESP32-IBN-SINO';
  private readonly DEFAULT_LOCATION = "Ibn Sino ko'chasi 17A, Samarqand";
  private readonly DEFAULT_LAT = 39.6742637;
  private readonly DEFAULT_LON = 66.9737814;
  private readonly FULL_FILL_LEVEL = 95;
  private readonly EMPTY_FILL_LEVEL = 15;
  private readonly ASSIGNMENT_TIMEOUT_MS = 10 * 60 * 1000;
  private readonly ARRIVAL_DISTANCE_KM = 0.03;

  private readonly assignmentTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(SensorReading)
    private readonly sensorReadingRepository: Repository<SensorReading>,
    @InjectRepository(SensorAlert)
    private readonly sensorAlertRepository: Repository<SensorAlert>,
    @InjectRepository(Bin)
    private readonly binRepository: Repository<Bin>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    private readonly sensorsGateway: SensorsGateway,
    private readonly routesService: RoutesService,
    private readonly cleaningsService: CleaningsService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  onModuleDestroy() {
    for (const timeout of this.assignmentTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.assignmentTimeouts.clear();
  }

  async handleSensorDistance(payload: IncomingSensorPayload) {
    const distance = Number(payload.distance);
    if (!Number.isFinite(distance)) {
      throw new Error('Invalid sensor distance value');
    }

    const binId = (payload.binId || this.DEFAULT_BIN_ID).trim();
    const location = (payload.location || this.DEFAULT_LOCATION).trim();
    const readingTimestamp = payload.timestamp ? new Date(payload.timestamp) : new Date();

    const savedReading = await this.sensorReadingRepository.save(
      this.sensorReadingRepository.create({
        distance,
        binId,
        location,
        isAlert: distance <= this.FULL_DISTANCE_THRESHOLD_CM,
        timestamp: readingTimestamp,
      }),
    );

    this.sensorsGateway.emitSensorData({
      id: savedReading.id,
      distance: Number(savedReading.distance),
      binId,
      location,
      timestamp: savedReading.timestamp,
    });

    const bin = await this.ensureBin(binId, location);
    const wasFull = bin.status === 'FULL';
    const isFull = distance <= this.FULL_DISTANCE_THRESHOLD_CM;

    bin.lastDistance = distance;
    bin.isOnline = true;

    if (isFull) {
      bin.status = 'FULL';
      bin.fillLevel = this.FULL_FILL_LEVEL;
    } else if (bin.status !== 'FULL') {
      bin.status = 'EMPTY';
      bin.fillLevel = this.estimateFillLevel(distance);
    }

    const updatedBin = await this.binRepository.save(bin);
    this.broadcastBinUpdate(updatedBin);

    let assignment: any = null;
    if (isFull) {
      if (!wasFull) {
        await this.createFullAlert(binId, location, distance);
        await this.safeLogActivity('bin_full', `Quti #${binId} to'ldi`, '95% to\'ldi. Dispecher ishga tushdi.', binId, undefined, location);
      }

      assignment = await this.assignNearestVehicleToBin(binId, { trigger: 'sensor' });
    }

    return {
      success: true,
      message: 'Sensor data processed successfully',
      data: {
        reading: savedReading,
        bin: this.toBinPayload(updatedBin),
        assignment,
      },
    };
  }

  async assignNearestVehicleToBin(binId: string, options: AssignmentOptions = {}) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let selectedVehicle: Vehicle | null = null;
    let lockedBin: Bin | null = null;
    let assignmentRoute: Route | null = null;

    try {
      const binRepo = queryRunner.manager.getRepository(Bin);
      const vehicleRepo = queryRunner.manager.getRepository(Vehicle);
      const routeRepo = queryRunner.manager.getRepository(Route);

      lockedBin = await binRepo
        .createQueryBuilder('bin')
        .setLock('pessimistic_write')
        .where('bin.binId = :binId', { binId })
        .getOne();

      if (!lockedBin) {
        await queryRunner.commitTransaction();
        return { success: false, reason: 'bin-not-found' };
      }

      if (lockedBin.status !== 'FULL') {
        await queryRunner.commitTransaction();
        return { success: false, reason: 'bin-not-full' };
      }

      const existingAssignmentVehicle = await vehicleRepo
        .createQueryBuilder('vehicle')
        .setLock('pessimistic_read')
        .where('vehicle.targetBinId = :binId', { binId })
        .andWhere('vehicle.isMoving = true OR vehicle.status IN (:...statuses)', {
          statuses: ['moving', 'cleaning'],
        })
        .orderBy('vehicle.updatedAt', 'DESC')
        .getOne();

      if (existingAssignmentVehicle) {
        await queryRunner.commitTransaction();
        return {
          success: true,
          reason: 'already-assigned',
          vehicleId: existingAssignmentVehicle.vehicleId,
          binId,
        };
      }

      const candidateQb = vehicleRepo
        .createQueryBuilder('vehicle')
        .setLock('pessimistic_read')
        .where('vehicle.status = :status', { status: 'idle' })
        .andWhere('vehicle.isMoving = false')
        .andWhere('vehicle.targetBinId IS NULL');

      if (options.excludeVehicleIds && options.excludeVehicleIds.length > 0) {
        candidateQb.andWhere('vehicle.vehicleId NOT IN (:...excludeIds)', {
          excludeIds: options.excludeVehicleIds,
        });
      }

      const candidates = await candidateQb.getMany();
      if (candidates.length === 0) {
        await queryRunner.commitTransaction();
        return { success: false, reason: 'no-available-vehicles', binId };
      }

      selectedVehicle = candidates.reduce((best, current) => {
        if (!best) return current;
        const bestDistance = this.calculateDistanceKm(
          Number(best.latitude),
          Number(best.longitude),
          Number(lockedBin!.latitude),
          Number(lockedBin!.longitude),
        );
        const currentDistance = this.calculateDistanceKm(
          Number(current.latitude),
          Number(current.longitude),
          Number(lockedBin!.latitude),
          Number(lockedBin!.longitude),
        );
        return currentDistance < bestDistance ? current : best;
      }, null as Vehicle | null);

      if (!selectedVehicle) {
        await queryRunner.commitTransaction();
        return { success: false, reason: 'no-nearest-vehicle-found', binId };
      }

      selectedVehicle.status = 'moving';
      selectedVehicle.isMoving = true;
      selectedVehicle.targetBinId = lockedBin.binId;
      await vehicleRepo.save(selectedVehicle);

      const fallbackRoutePath: number[][] = [
        [Number(selectedVehicle.latitude), Number(selectedVehicle.longitude)],
        [Number(lockedBin.latitude), Number(lockedBin.longitude)],
      ];
      const fallbackDistanceKm = this.calculateDistanceKm(
        Number(selectedVehicle.latitude),
        Number(selectedVehicle.longitude),
        Number(lockedBin.latitude),
        Number(lockedBin.longitude),
      );

      assignmentRoute = await routeRepo.save(
        routeRepo.create({
          vehicleId: selectedVehicle.vehicleId,
          binIds: [lockedBin.binId],
          startLatitude: Number(selectedVehicle.latitude),
          startLongitude: Number(selectedVehicle.longitude),
          routePath: JSON.stringify(fallbackRoutePath),
          totalDistance: fallbackDistanceKm,
          estimatedDuration: Math.max(1, Math.round(fallbackDistanceKm * 2)),
          status: 'pending',
        }),
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Assignment transaction failed: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }

    if (!selectedVehicle || !lockedBin || !assignmentRoute) {
      return { success: false, reason: 'assignment-incomplete' };
    }

    let routePath = this.parseRoutePath(assignmentRoute.routePath) || [];
    let distanceKm = Number(assignmentRoute.totalDistance);
    let durationMin = Number(assignmentRoute.estimatedDuration);
    let usedFallback = false;

    try {
      const osrmResult = await this.routesService.calculateRoute({
        startLat: Number(selectedVehicle.latitude),
        startLon: Number(selectedVehicle.longitude),
        endLat: Number(lockedBin.latitude),
        endLon: Number(lockedBin.longitude),
      });

      if (
        osrmResult?.success &&
        Array.isArray(osrmResult?.data?.routePath) &&
        osrmResult.data.routePath.length > 1
      ) {
        routePath = osrmResult.data.routePath;
        distanceKm = Number(osrmResult.data.distance) || distanceKm;
        durationMin = Number(osrmResult.data.duration) || durationMin;
      } else {
        usedFallback = true;
      }
    } catch (error) {
      usedFallback = true;
      this.logger.warn(`OSRM failed for assignment ${assignmentRoute.id}, using fallback route`);
    }

    assignmentRoute.routePath = JSON.stringify(routePath);
    assignmentRoute.totalDistance = distanceKm;
    assignmentRoute.estimatedDuration = durationMin;
    assignmentRoute.status = 'in-progress';
    assignmentRoute.startedAt = new Date();
    assignmentRoute = await this.routeRepository.save(assignmentRoute);

    this.scheduleAssignmentTimeout(assignmentRoute.id, selectedVehicle.vehicleId, lockedBin.binId);

    const dispatchPayload = {
      assignmentId: assignmentRoute.id,
      routeId: assignmentRoute.id,
      trigger: options.trigger || 'unknown',
      binId: lockedBin.binId,
      vehicleId: selectedVehicle.vehicleId,
      routePath,
      distanceKm,
      estimatedDurationMin: durationMin,
      assignedAt: new Date().toISOString(),
      fallbackRoute: usedFallback,
    };

    this.sensorsGateway.emitDispatchAssigned(dispatchPayload);
    this.sensorsGateway.emitVehicleStateUpdate({
      vehicleId: selectedVehicle.vehicleId,
      status: 'moving',
      isPatrolling: false,
      targetBinId: lockedBin.binId,
      currentRoute: routePath,
      routeId: assignmentRoute.id,
    });
    this.sensorsGateway.emitVehiclePositionUpdate({
      vehicleId: selectedVehicle.vehicleId,
      latitude: Number(selectedVehicle.latitude),
      longitude: Number(selectedVehicle.longitude),
      position: [Number(selectedVehicle.latitude), Number(selectedVehicle.longitude)],
      routeId: assignmentRoute.id,
      targetBinId: lockedBin.binId,
    });
    this.sensorsGateway.emitBinUpdate({
      ...this.toBinPayload(lockedBin),
      assignmentStatus: 'ASSIGNED',
      assignedVehicleId: selectedVehicle.vehicleId,
      assignmentRouteId: assignmentRoute.id,
      assignmentUpdatedAt: new Date().toISOString(),
    });

    await this.safeLogActivity(
      'dispatch_assigned',
      `${selectedVehicle.vehicleId} biriktirildi`,
      `${lockedBin.binId} qutiga eng yaqin mashina yuborildi`,
      lockedBin.binId,
      selectedVehicle.vehicleId,
      lockedBin.location,
    );

    return {
      success: true,
      ...dispatchPayload,
    };
  }

  async updateVehiclePosition(vehicleId: string, latitude: number, longitude: number) {
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new Error('Invalid vehicle coordinates');
    }

    const vehicle = await this.vehicleRepository.findOne({ where: { vehicleId } });
    if (!vehicle) {
      throw new Error(`Vehicle ${vehicleId} not found`);
    }

    vehicle.latitude = lat;
    vehicle.longitude = lon;
    const savedVehicle = await this.vehicleRepository.save(vehicle);

    this.sensorsGateway.emitVehiclePositionUpdate({
      vehicleId: savedVehicle.vehicleId,
      latitude: Number(savedVehicle.latitude),
      longitude: Number(savedVehicle.longitude),
      position: [Number(savedVehicle.latitude), Number(savedVehicle.longitude)],
      targetBinId: savedVehicle.targetBinId,
    });

    if (savedVehicle.targetBinId) {
      const targetBin = await this.binRepository.findOne({ where: { binId: savedVehicle.targetBinId } });
      if (targetBin) {
        const distanceToBin = this.calculateDistanceKm(
          Number(savedVehicle.latitude),
          Number(savedVehicle.longitude),
          Number(targetBin.latitude),
          Number(targetBin.longitude),
        );
        if (distanceToBin <= this.ARRIVAL_DISTANCE_KM) {
          this.logger.log(
            `Vehicle ${savedVehicle.vehicleId} arrived near ${targetBin.binId} (${distanceToBin.toFixed(3)} km)`,
          );
        }
      }
    }

    return savedVehicle;
  }

  async completeCleaningByVehicle(
    vehicleId: string,
    params: { binId?: string; notes?: string; source?: string } = {},
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let vehicle: Vehicle | null = null;
    let bin: Bin | null = null;
    let activeRoute: Route | null = null;
    let fillLevelBefore = this.FULL_FILL_LEVEL;

    try {
      const vehicleRepo = queryRunner.manager.getRepository(Vehicle);
      const binRepo = queryRunner.manager.getRepository(Bin);
      const routeRepo = queryRunner.manager.getRepository(Route);

      vehicle = await vehicleRepo
        .createQueryBuilder('vehicle')
        .setLock('pessimistic_write')
        .where('vehicle.vehicleId = :vehicleId', { vehicleId })
        .getOne();

      if (!vehicle) {
        throw new Error(`Vehicle ${vehicleId} not found`);
      }

      const targetBinId = params.binId || vehicle.targetBinId;
      if (!targetBinId) {
        await queryRunner.commitTransaction();
        return {
          success: false,
          reason: 'vehicle-has-no-target-bin',
          vehicleId,
        };
      }

      bin = await binRepo
        .createQueryBuilder('bin')
        .setLock('pessimistic_write')
        .where('bin.binId = :binId', { binId: targetBinId })
        .getOne();

      if (!bin) {
        throw new Error(`Bin ${targetBinId} not found`);
      }

      activeRoute = await routeRepo
        .createQueryBuilder('route')
        .setLock('pessimistic_write')
        .where('route.vehicleId = :vehicleId', { vehicleId: vehicle.vehicleId })
        .andWhere('route.status IN (:...statuses)', { statuses: ['pending', 'in-progress'] })
        .orderBy('route.createdAt', 'DESC')
        .getOne();

      fillLevelBefore = Number(bin.fillLevel) || this.FULL_FILL_LEVEL;

      bin.status = 'EMPTY';
      bin.fillLevel = this.EMPTY_FILL_LEVEL;
      bin.lastCleaningTime = new Date();
      bin.totalCleanings = Number(bin.totalCleanings || 0) + 1;
      await binRepo.save(bin);

      vehicle.status = 'idle';
      vehicle.isMoving = false;
      vehicle.targetBinId = null;
      vehicle.lastCleaningTime = new Date();
      vehicle.totalCleanings = Number(vehicle.totalCleanings || 0) + 1;
      await vehicleRepo.save(vehicle);

      if (activeRoute) {
        activeRoute.status = 'completed';
        activeRoute.completedAt = new Date();
        if (!activeRoute.startedAt) {
          activeRoute.startedAt = new Date();
        }
        await routeRepo.save(activeRoute);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Complete cleaning transaction failed: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }

    if (!vehicle || !bin) {
      return { success: false, reason: 'complete-cleaning-incomplete' };
    }

    if (activeRoute) {
      this.clearAssignmentTimeout(activeRoute.id);
    }

    const routePath = this.parseRoutePath(activeRoute?.routePath);
    const distanceTraveled =
      activeRoute?.totalDistance ||
      this.calculateDistanceKm(
        Number(vehicle.latitude),
        Number(vehicle.longitude),
        Number(bin.latitude),
        Number(bin.longitude),
      );

    try {
      await this.cleaningsService.createCleaning({
        binId: bin.binId,
        vehicleId: vehicle.vehicleId,
        driverName: vehicle.driver,
        binLocation: bin.location || bin.address || this.DEFAULT_LOCATION,
        fillLevelBefore: Math.round(fillLevelBefore),
        fillLevelAfter: this.EMPTY_FILL_LEVEL,
        distanceTraveled: Number(distanceTraveled) || 0,
        durationMinutes: Math.max(1, Number(activeRoute?.estimatedDuration || 1)),
        notes: params.notes || 'Backend completion flow',
        status: 'completed',
      });
    } catch (error) {
      this.logger.error(`Failed to create cleaning history record: ${error.message}`);
    }

    this.sensorsGateway.emitBinStatusChange(bin.binId, 'EMPTY');
    this.broadcastBinUpdate(bin);
    this.sensorsGateway.emitVehicleStateUpdate({
      vehicleId: vehicle.vehicleId,
      status: 'idle',
      isPatrolling: true,
      targetBinId: null,
      currentRoute: null,
      routeId: activeRoute?.id || null,
      completedAt: new Date().toISOString(),
    });
    this.sensorsGateway.emitVehiclePositionUpdate({
      vehicleId: vehicle.vehicleId,
      latitude: Number(vehicle.latitude),
      longitude: Number(vehicle.longitude),
      position: [Number(vehicle.latitude), Number(vehicle.longitude)],
      targetBinId: null,
    });

    await this.safeLogActivity(
      'bin_cleaned',
      `Quti #${bin.binId} tozalandi`,
      `${vehicle.vehicleId} tozalashni yakunladi`,
      bin.binId,
      vehicle.vehicleId,
      bin.location,
    );

    return {
      success: true,
      message: 'Cleaning completed by backend dispatcher',
      data: {
        vehicleId: vehicle.vehicleId,
        binId: bin.binId,
        routeId: activeRoute?.id || null,
        routePath,
      },
    };
  }

  async decorateVehicleWithRuntimeState(vehicle: Vehicle) {
    const activeRoute = await this.routeRepository.findOne({
      where: [
        { vehicleId: vehicle.vehicleId, status: 'pending' },
        { vehicleId: vehicle.vehicleId, status: 'in-progress' },
      ],
      order: { createdAt: 'DESC' },
    });

    const currentRoute = this.parseRoutePath(activeRoute?.routePath);
    return {
      ...vehicle,
      routeId: activeRoute?.id || null,
      currentRoute,
      isPatrolling: !vehicle.isMoving && !vehicle.targetBinId,
    };
  }

  async decorateVehiclesWithRuntimeState(vehicles: Vehicle[]) {
    return Promise.all(vehicles.map((vehicle) => this.decorateVehicleWithRuntimeState(vehicle)));
  }

  private async ensureBin(binId: string, location: string) {
    let bin = await this.binRepository.findOne({ where: { binId } });
    if (bin) return bin;

    try {
      bin = await this.binRepository.save(
        this.binRepository.create({
          binId,
          code: binId,
          location,
          address: location,
          district: 'Samarqand',
          latitude: this.DEFAULT_LAT,
          longitude: this.DEFAULT_LON,
          capacity: 120,
          status: 'EMPTY',
          fillLevel: this.EMPTY_FILL_LEVEL,
          type: 'standard',
          sensorId: binId,
          isOnline: true,
          batteryLevel: 100,
        }),
      );
      await this.safeLogActivity(
        'bin_added',
        'Yangi quti avtomatik yaratildi',
        `${binId} sensor oqimidan kelib chiqib yaratildi`,
        binId,
        undefined,
        location,
      );
      return bin;
    } catch (error) {
      // Parallel requests can hit unique key; refetch for idempotency.
      const existing = await this.binRepository.findOne({ where: { binId } });
      if (existing) return existing;
      throw error;
    }
  }

  private async createFullAlert(binId: string, location: string, distance: number) {
    const alert = this.sensorAlertRepository.create({
      distance,
      binId,
      location,
      message: `ALERT: ${binId} full (distance ${distance} cm)`,
      status: 'active',
    });
    await this.sensorAlertRepository.save(alert);
  }

  private scheduleAssignmentTimeout(routeId: string, vehicleId: string, binId: string) {
    this.clearAssignmentTimeout(routeId);

    const timeout = setTimeout(async () => {
      try {
        await this.handleAssignmentTimeout(routeId, vehicleId, binId);
      } catch (error) {
        this.logger.error(`Assignment timeout handler error (${routeId}): ${error.message}`);
      }
    }, this.ASSIGNMENT_TIMEOUT_MS);

    this.assignmentTimeouts.set(routeId, timeout);
  }

  private clearAssignmentTimeout(routeId: string) {
    const existing = this.assignmentTimeouts.get(routeId);
    if (existing) {
      clearTimeout(existing);
      this.assignmentTimeouts.delete(routeId);
    }
  }

  private async handleAssignmentTimeout(routeId: string, vehicleId: string, binId: string) {
    const route = await this.routeRepository.findOne({ where: { id: routeId } });
    if (!route) {
      this.clearAssignmentTimeout(routeId);
      return;
    }

    if (!['pending', 'in-progress'].includes(route.status)) {
      this.clearAssignmentTimeout(routeId);
      return;
    }

    this.logger.warn(`Vehicle ${vehicleId} looks stuck for bin ${binId}; reassign flow started`);

    route.status = 'cancelled';
    route.completedAt = new Date();
    await this.routeRepository.save(route);
    this.clearAssignmentTimeout(routeId);

    const vehicle = await this.vehicleRepository.findOne({ where: { vehicleId } });
    if (vehicle && vehicle.targetBinId === binId) {
      vehicle.status = 'idle';
      vehicle.isMoving = false;
      vehicle.targetBinId = null;
      await this.vehicleRepository.save(vehicle);
      this.sensorsGateway.emitVehicleStateUpdate({
        vehicleId: vehicle.vehicleId,
        status: 'idle',
        isPatrolling: true,
        targetBinId: null,
        currentRoute: null,
        timeout: true,
      });
    }

    await this.safeLogActivity(
      'dispatch_timeout',
      `Timeout: ${vehicleId}`,
      `${binId} uchun biriktirish timeout bo'ldi, qayta biriktirish boshlandi`,
      binId,
      vehicleId,
      this.DEFAULT_LOCATION,
    );

    await this.assignNearestVehicleToBin(binId, {
      excludeVehicleIds: [vehicleId],
      trigger: 'timeout-reassign',
    });
  }

  private broadcastBinUpdate(bin: Bin) {
    const binPayload = this.toBinPayload(bin);
    this.sensorsGateway.emitBinUpdate(binPayload);
    this.sensorsGateway.emitBinStatusChange(bin.binId, bin.status === 'FULL' ? 'FULL' : 'EMPTY');
  }

  private toBinPayload(bin: Bin) {
    return {
      id: bin.id,
      binId: bin.binId,
      code: bin.code || bin.binId,
      address: bin.address || bin.location,
      locationName: bin.location,
      district: bin.district,
      latitude: Number(bin.latitude),
      longitude: Number(bin.longitude),
      location: [Number(bin.latitude), Number(bin.longitude)],
      status: bin.status,
      fillLevel: Number(bin.fillLevel),
      lastDistance: Number(bin.lastDistance || 0),
      sensorId: bin.sensorId || bin.binId,
      isOnline: bin.isOnline,
      batteryLevel: bin.batteryLevel,
      lastCleaningTime: bin.lastCleaningTime,
      updatedAt: bin.updatedAt,
    };
  }

  private estimateFillLevel(distanceCm: number) {
    const clampedDistance = Math.max(0, Math.min(distanceCm, 120));
    const estimated = Math.round((1 - clampedDistance / 120) * 100);
    return Math.max(this.EMPTY_FILL_LEVEL, Math.min(this.FULL_FILL_LEVEL, estimated));
  }

  private parseRoutePath(routePath?: string | null): number[][] | null {
    if (!routePath) return null;
    try {
      const parsed = JSON.parse(routePath);
      if (!Array.isArray(parsed)) return null;
      return parsed
        .filter((point) => Array.isArray(point) && point.length >= 2)
        .map((point) => [Number(point[0]), Number(point[1])]);
    } catch (_error) {
      return null;
    }
  }

  private async safeLogActivity(
    type: string,
    title: string,
    description: string,
    binId?: string,
    vehicleId?: string,
    location: string = this.DEFAULT_LOCATION,
  ) {
    try {
      await this.activitiesService.createActivity({
        type,
        title,
        description,
        binId,
        vehicleId,
        location,
      });
    } catch (error) {
      this.logger.warn(`Activity log failed (${type}): ${error.message}`);
    }
  }

  private calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(value: number) {
    return (value * Math.PI) / 180;
  }
}
