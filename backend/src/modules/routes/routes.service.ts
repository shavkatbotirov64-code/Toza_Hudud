import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Route, RouteStatus } from './entities/route.entity';
import { RouteBin, RouteBinStatus } from './entities/route-bin.entity';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(Route)
    private routeRepository: Repository<Route>,
    @InjectRepository(RouteBin)
    private routeBinRepository: Repository<RouteBin>,
  ) {}

  async create(createRouteDto: CreateRouteDto) {
    const { binIds, ...routeData } = createRouteDto;

    // Create route
    const route = this.routeRepository.create({
      ...routeData,
      totalBins: binIds.length,
      scheduledStartTime: createRouteDto.scheduledStartTime 
        ? new Date(createRouteDto.scheduledStartTime) 
        : undefined,
    });

    const savedRoute = await this.routeRepository.save(route);

    // Create route bins
    const routeBins = binIds.map((binId, index) => ({
      routeId: savedRoute.id,
      binId,
      sequenceOrder: index + 1,
      status: RouteBinStatus.PENDING,
    }));

    await this.routeBinRepository.save(routeBins);

    return {
      success: true,
      message: 'Route created successfully',
      data: savedRoute,
    };
  }

  async findAll(filters: any = {}) {
    const { page = 1, limit = 10, status, priority } = filters;
    const skip = (page - 1) * limit;

    const queryBuilder = this.routeRepository.createQueryBuilder('route');

    if (status) {
      queryBuilder.andWhere('route.status = :status', { status });
    }

    if (priority) {
      queryBuilder.andWhere('route.priority = :priority', { priority });
    }

    const [routes, total] = await queryBuilder
      .orderBy('route.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      success: true,
      message: 'Routes retrieved successfully',
      data: routes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getStatistics() {
    const totalRoutes = await this.routeRepository.count();
    const activeRoutes = await this.routeRepository.count({
      where: { status: RouteStatus.IN_PROGRESS },
    });
    const completedRoutes = await this.routeRepository.count({
      where: { status: RouteStatus.COMPLETED },
    });

    const statusDistribution = await this.routeRepository
      .createQueryBuilder('route')
      .select('route.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('route.status')
      .getRawMany();

    const priorityDistribution = await this.routeRepository
      .createQueryBuilder('route')
      .select('route.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .groupBy('route.priority')
      .getRawMany();

    const averageCompletion = await this.routeRepository
      .createQueryBuilder('route')
      .select('AVG(route.completionPercentage)', 'avgCompletion')
      .getRawOne();

    return {
      success: true,
      message: 'Statistics retrieved successfully',
      data: {
        totalRoutes,
        activeRoutes,
        completedRoutes,
        statusDistribution,
        priorityDistribution,
        averageCompletion: parseFloat(averageCompletion.avgCompletion) || 0,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async findOne(id: string) {
    const route = await this.routeRepository.findOne({
      where: { id },
    });

    if (!route) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }

    // Get route bins with bin details
    const routeBins = await this.routeBinRepository
      .createQueryBuilder('routeBin')
      .leftJoinAndSelect('routeBin.bin', 'bin')
      .where('routeBin.routeId = :routeId', { routeId: id })
      .orderBy('routeBin.sequenceOrder', 'ASC')
      .getMany();

    return {
      success: true,
      message: 'Route retrieved successfully',
      data: {
        ...route,
        bins: routeBins,
      },
    };
  }

  async update(id: string, updateRouteDto: UpdateRouteDto) {
    const route = await this.routeRepository.findOne({ where: { id } });

    if (!route) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }

    const updatedRoute = await this.routeRepository.save({
      ...route,
      ...updateRouteDto,
      updatedAt: new Date(),
    });

    return {
      success: true,
      message: 'Route updated successfully',
      data: updatedRoute,
    };
  }

  async startRoute(id: string) {
    const route = await this.routeRepository.findOne({ where: { id } });

    if (!route) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }

    if (route.status !== RouteStatus.PLANNED) {
      throw new BadRequestException(`Route must be in planned status to start`);
    }

    const updatedRoute = await this.routeRepository.save({
      ...route,
      status: RouteStatus.IN_PROGRESS,
      actualStartTime: new Date(),
      updatedAt: new Date(),
    });

    return {
      success: true,
      message: 'Route started successfully',
      data: updatedRoute,
    };
  }

  async completeRoute(id: string) {
    const route = await this.routeRepository.findOne({ where: { id } });

    if (!route) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }

    if (route.status !== RouteStatus.IN_PROGRESS) {
      throw new BadRequestException(`Route must be in progress to complete`);
    }

    const updatedRoute = await this.routeRepository.save({
      ...route,
      status: RouteStatus.COMPLETED,
      actualEndTime: new Date(),
      completionPercentage: 100,
      updatedAt: new Date(),
    });

    return {
      success: true,
      message: 'Route completed successfully',
      data: updatedRoute,
    };
  }

  async remove(id: string) {
    const route = await this.routeRepository.findOne({ where: { id } });

    if (!route) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }

    await this.routeRepository.remove(route);

    return {
      success: true,
      message: 'Route deleted successfully',
    };
  }
}