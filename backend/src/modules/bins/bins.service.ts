import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Bin, BinStatus } from './entities/bin.entity';
import { BinHistory, HistoryAction } from './entities/bin-history.entity';
import { CreateBinDto } from './dto/create-bin.dto';
import { UpdateBinDto } from './dto/update-bin.dto';
import { QueryBinsDto } from './dto/query-bins.dto';
import { PaginatedResponse, ApiResponse } from '../../common/interfaces/response.interface';

@Injectable()
export class BinsService {
  constructor(
    @InjectRepository(Bin)
    private binsRepository: Repository<Bin>,
    @InjectRepository(BinHistory)
    private binHistoryRepository: Repository<BinHistory>,
  ) {}

  async create(createBinDto: CreateBinDto): Promise<ApiResponse<Bin>> {
    try {
      // Check if bin code already exists
      const existingBin = await this.binsRepository.findOne({
        where: { code: createBinDto.code },
      });

      if (existingBin) {
        throw new ConflictException({
          success: false,
          message: 'Bin with this code already exists',
          error: `Bin code ${createBinDto.code} is already in use`,
          timestamp: new Date().toISOString(),
        });
      }

      const bin = this.binsRepository.create({
        ...createBinDto,
        lastUpdate: new Date(),
      });

      const savedBin = await this.binsRepository.save(bin);

      // Create history record
      await this.createHistoryRecord(
        savedBin.id,
        HistoryAction.STATUS_CHANGE,
        'Bin created and activated',
        { status: savedBin.status },
        'system',
      );

      return {
        success: true,
        message: 'Bin created successfully',
        data: savedBin,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // If it's already a NestJS exception, re-throw it
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }

      // Handle database errors
      if (error.code === '23505') { // PostgreSQL unique constraint violation
        throw new ConflictException({
          success: false,
          message: 'Bin with this code already exists',
          error: `Bin code ${createBinDto.code} is already in use`,
          timestamp: new Date().toISOString(),
        });
      }

      // Handle other database errors
      throw new BadRequestException({
        success: false,
        message: 'Failed to create bin',
        error: error.message || 'Database error occurred',
        timestamp: new Date().toISOString(),
      });
    }
  }

  async findAll(queryDto: QueryBinsDto): Promise<PaginatedResponse<Bin>> {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        status,
        district,
        minFillLevel,
        maxFillLevel,
        isOnline,
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      } = queryDto;

      const queryBuilder = this.binsRepository.createQueryBuilder('bin');

      // Apply filters
      if (type) {
        queryBuilder.andWhere('bin.type = :type', { type });
      }

      if (status) {
        queryBuilder.andWhere('bin.status = :status', { status });
      }

      if (district) {
        queryBuilder.andWhere('bin.district = :district', { district });
      }

      if (minFillLevel !== undefined) {
        queryBuilder.andWhere('bin.fillLevel >= :minFillLevel', { minFillLevel });
      }

      if (maxFillLevel !== undefined) {
        queryBuilder.andWhere('bin.fillLevel <= :maxFillLevel', { maxFillLevel });
      }

      if (isOnline !== undefined) {
        queryBuilder.andWhere('bin.isOnline = :isOnline', { isOnline });
      }

      if (search) {
        queryBuilder.andWhere(
          '(bin.code ILIKE :search OR bin.address ILIKE :search OR bin.district ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      // Apply sorting
      queryBuilder.orderBy(`bin.${sortBy}`, sortOrder);

      // Apply pagination
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      const [bins, total] = await queryBuilder.getManyAndCount();
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        message: 'Bins retrieved successfully',
        data: bins,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: 'Failed to retrieve bins',
        error: error.message || 'Database query error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  async findOne(id: string): Promise<ApiResponse<Bin>> {
    const bin = await this.binsRepository.findOne({
      where: { id },
      relations: ['history'],
    });

    if (!bin) {
      throw new NotFoundException({
        success: false,
        message: 'Bin not found',
        error: `Bin with ID ${id} does not exist`,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      success: true,
      message: 'Bin retrieved successfully',
      data: bin,
      timestamp: new Date().toISOString(),
    };
  }

  async update(id: string, updateBinDto: UpdateBinDto): Promise<ApiResponse<Bin>> {
    try {
      const bin = await this.binsRepository.findOne({ where: { id } });

      if (!bin) {
        throw new NotFoundException({
          success: false,
          message: 'Bin not found',
          error: `Bin with ID ${id} does not exist`,
          timestamp: new Date().toISOString(),
        });
      }

      // Track changes for history
      const changes: any = {};
      Object.keys(updateBinDto).forEach((key) => {
        if (bin[key] !== updateBinDto[key]) {
          changes[key] = {
            old: bin[key],
            new: updateBinDto[key],
          };
        }
      });

      // Update bin
      Object.assign(bin, updateBinDto);
      bin.lastUpdate = new Date();

      const updatedBin = await this.binsRepository.save(bin);

      // Create history records for significant changes
      if (changes.fillLevel) {
        await this.createHistoryRecord(
          id,
          HistoryAction.FILL_LEVEL_UPDATE,
          `Fill level changed from ${changes.fillLevel.old}% to ${changes.fillLevel.new}%`,
          changes.fillLevel,
          'system',
        );
      }

      if (changes.status) {
        await this.createHistoryRecord(
          id,
          HistoryAction.STATUS_CHANGE,
          `Status changed from ${changes.status.old} to ${changes.status.new}`,
          changes.status,
          'system',
        );
      }

      if (changes.isOnline !== undefined) {
        const action = changes.isOnline.new ? HistoryAction.SENSOR_ONLINE : HistoryAction.SENSOR_OFFLINE;
        await this.createHistoryRecord(
          id,
          action,
          `Sensor went ${changes.isOnline.new ? 'online' : 'offline'}`,
          changes.isOnline,
          'system',
        );
      }

      return {
        success: true,
        message: 'Bin updated successfully',
        data: updatedBin,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException({
        success: false,
        message: 'Failed to update bin',
        error: error.message || 'Database error occurred',
        timestamp: new Date().toISOString(),
      });
    }
  }

  async remove(id: string): Promise<ApiResponse<void>> {
    try {
      const bin = await this.binsRepository.findOne({ where: { id } });

      if (!bin) {
        throw new NotFoundException({
          success: false,
          message: 'Bin not found',
          error: `Bin with ID ${id} does not exist`,
          timestamp: new Date().toISOString(),
        });
      }

      await this.binsRepository.remove(bin);

      return {
        success: true,
        message: 'Bin deleted successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException({
        success: false,
        message: 'Failed to delete bin',
        error: error.message || 'Database error occurred',
        timestamp: new Date().toISOString(),
      });
    }
  }

  async getStatistics(): Promise<ApiResponse<any>> {
    const totalBins = await this.binsRepository.count();
    const activeBins = await this.binsRepository.count({
      where: { status: BinStatus.ACTIVE },
    });
    const onlineBins = await this.binsRepository.count({
      where: { isOnline: true },
    });

    const fillLevelStats = await this.binsRepository
      .createQueryBuilder('bin')
      .select([
        'COUNT(CASE WHEN bin.fillLevel < 30 THEN 1 END) as empty',
        'COUNT(CASE WHEN bin.fillLevel >= 30 AND bin.fillLevel < 70 THEN 1 END) as half',
        'COUNT(CASE WHEN bin.fillLevel >= 70 AND bin.fillLevel < 90 THEN 1 END) as warning',
        'COUNT(CASE WHEN bin.fillLevel >= 90 THEN 1 END) as full',
        'AVG(bin.fillLevel) as averageFillLevel',
      ])
      .where('bin.status = :status', { status: BinStatus.ACTIVE })
      .getRawOne();

    const districtStats = await this.binsRepository
      .createQueryBuilder('bin')
      .select(['bin.district', 'COUNT(*) as count', 'AVG(bin.fillLevel) as avgFillLevel'])
      .where('bin.status = :status', { status: BinStatus.ACTIVE })
      .groupBy('bin.district')
      .getRawMany();

    return {
      success: true,
      message: 'Statistics retrieved successfully',
      data: {
        totalBins,
        activeBins,
        onlineBins,
        offlineBins: totalBins - onlineBins,
        fillLevelDistribution: {
          empty: parseInt(fillLevelStats.empty) || 0,
          half: parseInt(fillLevelStats.half) || 0,
          warning: parseInt(fillLevelStats.warning) || 0,
          full: parseInt(fillLevelStats.full) || 0,
        },
        averageFillLevel: parseFloat(fillLevelStats.averageFillLevel) || 0,
        districtStats,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async markAsCleaned(id: string): Promise<ApiResponse<Bin>> {
    const bin = await this.binsRepository.findOne({ where: { id } });

    if (!bin) {
      throw new NotFoundException({
        success: false,
        message: 'Bin not found',
        error: `Bin with ID ${id} does not exist`,
        timestamp: new Date().toISOString(),
      });
    }

    const oldFillLevel = bin.fillLevel;
    bin.fillLevel = 0;
    bin.lastCleaned = new Date();
    bin.lastUpdate = new Date();

    const updatedBin = await this.binsRepository.save(bin);

    // Create history record
    await this.createHistoryRecord(
      id,
      HistoryAction.CLEANED,
      `Bin cleaned - fill level reset from ${oldFillLevel}% to 0%`,
      { oldFillLevel, newFillLevel: 0 },
      'system',
    );

    return {
      success: true,
      message: 'Bin marked as cleaned successfully',
      data: updatedBin,
      timestamp: new Date().toISOString(),
    };
  }

  private async createHistoryRecord(
    binId: string,
    action: HistoryAction,
    description: string,
    metadata?: any,
    performedBy?: string,
  ): Promise<void> {
    try {
      const historyRecord = this.binHistoryRepository.create({
        binId,
        action,
        description,
        metadata,
        performedBy,
      });

      await this.binHistoryRepository.save(historyRecord);
    } catch (error) {
      // Log the error but don't throw - history is not critical
      console.error('Failed to create history record:', error);
    }
  }
}