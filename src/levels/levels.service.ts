import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { isValidObjectId, Model } from 'mongoose';
import { CreateLevelDto } from './dto/create-level.dto';
import { UpdateLevelDto } from './dto/update-level.dto';
import { Level } from './entities/level.entity';
import { QueryPaginateDto } from '../common/dto/query-paginate.dto';
import { handleExceptions } from '../common/helpers/handle-exception';

@Injectable()
export class LevelsService {
  private defaultLimit: number;
  constructor(
    @InjectModel(Level.name)
    private readonly levelModel: Model<Level>,
    private readonly configService: ConfigService,
  ) {
    this.defaultLimit = this.configService.get<number>('defaultLimit')!;
  }

  async create(createLevelDto: CreateLevelDto) {
    try {
      return await this.levelModel.create(createLevelDto);
    } catch (error) {
      handleExceptions(error, 'Level');
    }
  }

  async findAll(queryPaginateDto: QueryPaginateDto) {
    const { search, limit, offset, sort } = queryPaginateDto;
    const filters: any = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filters.$or = [{ name: searchRegex }];
    }

    const mongooseQuery = this.levelModel.find(filters);
    mongooseQuery.select('-__v');

    if (limit) {
      mongooseQuery.limit(limit);
    }

    if (offset) {
      mongooseQuery.skip(offset);
    }

    if (sort) {
      mongooseQuery.sort(sort.replace(/,/g, ' '));
    }

    return mongooseQuery.exec();
  }

  async findOne(term: string) {
    let level: Level | null = null;
    console.log(term);

    level = await this.levelModel.findOne({ name: term?.toLowerCase().trim() });

    if (!level && isValidObjectId(term)) {
      level = await this.levelModel.findById(term);
    }

    if (!level)
      throw new NotFoundException(
        `Level with "id" or "name" ${term} not found`,
      );

    return level;
  }

  async update(id: string, updateLevelDto: UpdateLevelDto) {
    const level = await this.findOne(id);

    if (updateLevelDto.name) updateLevelDto.name.toLowerCase();
    if (updateLevelDto.description) updateLevelDto.description.toLowerCase();

    try {
      await level.updateOne(updateLevelDto);
      return { ...level.toJSON(), ...updateLevelDto };
    } catch (error) {
      handleExceptions(error, 'Level');
    }
  }

  async remove(id: string) {
    const { deletedCount } = await this.levelModel.deleteOne({ _id: id });
    if (deletedCount === 0)
      throw new NotFoundException(`Level with id ${id} not found`);
    return;
  }
}
