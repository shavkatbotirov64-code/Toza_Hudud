import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bin } from './entities/bin.entity';

@Injectable()
export class BinsService {
  private readonly logger = new Logger(BinsService.name);

  constructor(
    @InjectRepository(Bin)
    private binRepository: Repository<Bin>,
  ) {}

  // Quti yaratish yoki yangilash
  async upsertBin(data: {
    binId: string;
    location: string;
    latitude: number;
    longitude: number;
    capacity?: number;
  }): Promise<Bin> {
    try {
      let bin = await this.binRepository.findOne({
        where: { binId: data.binId },
      });

      if (bin) {
        // Yangilash
        bin.location = data.location;
        bin.latitude = data.latitude;
        bin.longitude = data.longitude;
        if (data.capacity) bin.capacity = data.capacity;
      } else {
        // Yaratish
        bin = this.binRepository.create({
          binId: data.binId,
          location: data.location,
          latitude: data.latitude,
          longitude: data.longitude,
          capacity: data.capacity || 120,
          status: 'EMPTY',
          fillLevel: 15,
        });
      }

      const saved = await this.binRepository.save(bin);
      this.logger.log(`🗑️ Bin saved: ${saved.binId} at ${saved.location}`);
      return saved;
    } catch (error) {
      this.logger.error(`❌ Error saving bin: ${error.message}`);
      throw error;
    }
  }

  // Quti holatini olish
  async getBinStatus(binId: string): Promise<Bin> {
    try {
      const bin = await this.binRepository.findOne({
        where: { binId },
      });

      if (!bin) {
        throw new NotFoundException(`Bin ${binId} not found`);
      }

      return bin;
    } catch (error) {
      this.logger.error(`❌ Error getting bin status: ${error.message}`);
      throw error;
    }
  }

  // Barcha qutilar
  async getAllBins(): Promise<Bin[]> {
    try {
      const bins = await this.binRepository.find({
        order: { updatedAt: 'DESC' },
      });
      return bins;
    } catch (error) {
      this.logger.error(`❌ Error getting all bins: ${error.message}`);
      return [];
    }
  }

  // To'la qutilar
  async getFullBins(): Promise<Bin[]> {
    try {
      const bins = await this.binRepository.find({
        where: { status: 'FULL' },
        order: { updatedAt: 'DESC' },
      });
      this.logger.log(`🔴 Found ${bins.length} full bins`);
      return bins;
    } catch (error) {
      this.logger.error(`❌ Error getting full bins: ${error.message}`);
      return [];
    }
  }

  // Quti holatini o'zgartirish
  async updateBinStatus(
    binId: string,
    status: 'FULL' | 'EMPTY',
    fillLevel?: number,
    distance?: number,
  ): Promise<Bin> {
    try {
      const bin = await this.getBinStatus(binId);

      bin.status = status;
      if (fillLevel !== undefined) bin.fillLevel = fillLevel;
      if (distance !== undefined) bin.lastDistance = distance;
      bin.updatedAt = new Date();

      const saved = await this.binRepository.save(bin);
      this.logger.log(`🗑️ Bin status updated: ${binId} → ${status} (${fillLevel}%)`);
      return saved;
    } catch (error) {
      this.logger.error(`❌ Error updating bin status: ${error.message}`);
      throw error;
    }
  }

  // Qutini tozalash
  async cleanBin(binId: string): Promise<Bin> {
    try {
      const bin = await this.getBinStatus(binId);

      bin.status = 'EMPTY';
      bin.fillLevel = 15; // Bo'sh holat
      bin.lastCleaningTime = new Date();
      bin.totalCleanings += 1;

      const saved = await this.binRepository.save(bin);
      this.logger.log(`🧹 Bin cleaned: ${binId} (Total cleanings: ${saved.totalCleanings})`);
      return saved;
    } catch (error) {
      this.logger.error(`❌ Error cleaning bin: ${error.message}`);
      throw error;
    }
  }

  // ESP32 dan ma'lumot kelganda qutini FULL qilish
  async markBinAsFull(binId: string, distance: number): Promise<Bin> {
    try {
      const bin = await this.getBinStatus(binId);

      bin.status = 'FULL';
      bin.fillLevel = 95; // To'la holat
      bin.lastDistance = distance;
      bin.updatedAt = new Date();

      const saved = await this.binRepository.save(bin);
      this.logger.log(`🔴 Bin marked as FULL: ${binId} (distance: ${distance} sm)`);
      return saved;
    } catch (error) {
      this.logger.error(`❌ Error marking bin as full: ${error.message}`);
      throw error;
    }
  }
}
