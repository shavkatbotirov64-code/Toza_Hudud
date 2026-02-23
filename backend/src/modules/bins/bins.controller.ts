import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { BinsService } from './bins.service';
import { CreateBinDto } from './dto/create-bin.dto';
import { UpdateBinDto } from './dto/update-bin.dto';
import { QueryBinsDto } from './dto/query-bins.dto';
import { Bin } from './entities/bin.entity';
import { ApiSuccessResponse, ApiPaginatedResponse } from '../../common/decorators/api-response.decorator';

@ApiTags('Bins')
@Controller('admin/bins')
export class BinsController {
  private readonly logger = new Logger(BinsController.name);

  constructor(private readonly binsService: BinsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new bin' })
  @ApiSuccessResponse(Bin, 'Bin created successfully')
  @ApiResponse({ status: 409, description: 'Bin code already exists' })
  async create(@Body() createBinDto: CreateBinDto) {
    try {
      this.logger.log(`🗑 Creating new bin: ${createBinDto.code}`);
      this.logger.debug(`📝 Bin data: ${JSON.stringify(createBinDto)}`);

      const result = await this.binsService.create(createBinDto);

      this.logger.log(`✅ Bin created successfully: ${createBinDto.code}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Error creating bin ${createBinDto.code}: ${error.message}`);
      this.logger.debug(`🔍 Error details: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all bins with filtering and pagination' })
  @ApiPaginatedResponse(Bin, 'Bins retrieved successfully')
  async findAll(@Query() queryDto: QueryBinsDto) {
    try {
      // this.logger.log(`🔍 Getting bins with query: ${JSON.stringify(queryDto)}`);

      const result = await this.binsService.findAll(queryDto);

      // this.logger.log(`✅ Retrieved ${result.data.length} bins (total: ${result.pagination.total})`);
      // this.logger.debug(`📊 Pagination: page ${result.pagination.page}/${result.pagination.totalPages}`);

      return result;
    } catch (error) {
      this.logger.error(`❌ Error getting bins: ${error.message}`);
      this.logger.debug(`🔍 Error details: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get bins statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Statistics retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            totalBins: { type: 'number', example: 100 },
            activeBins: { type: 'number', example: 95 },
            onlineBins: { type: 'number', example: 92 },
            offlineBins: { type: 'number', example: 3 },
            fillLevelDistribution: {
              type: 'object',
              properties: {
                empty: { type: 'number', example: 25 },
                half: { type: 'number', example: 40 },
                warning: { type: 'number', example: 20 },
                full: { type: 'number', example: 10 },
              },
            },
            averageFillLevel: { type: 'number', example: 65.5 },
          },
        },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
      },
    },
  })
  getStatistics() {
    return this.binsService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bin by ID' })
  @ApiSuccessResponse(Bin, 'Bin retrieved successfully')
  @ApiResponse({ status: 404, description: 'Bin not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.binsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update bin' })
  @ApiSuccessResponse(Bin, 'Bin updated successfully')
  @ApiResponse({ status: 404, description: 'Bin not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBinDto: UpdateBinDto,
  ) {
    return this.binsService.update(id, updateBinDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete bin' })
  @ApiResponse({
    status: 200,
    description: 'Bin deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Bin deleted successfully' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Bin not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.binsService.remove(id);
  }

  @Patch(':id/clean')
  @ApiOperation({ summary: 'Mark bin as cleaned' })
  @ApiSuccessResponse(Bin, 'Bin marked as cleaned successfully')
  @ApiResponse({ status: 404, description: 'Bin not found' })
  markAsCleaned(@Param('id', ParseUUIDPipe) id: string) {
    return this.binsService.markAsCleaned(id);
  }
}
