import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CreateLevelDto } from './dto/create-level.dto';
import { UpdateLevelDto } from './dto/update-level.dto';
import { Level } from './entities/level.entity';
import { handleExceptions } from '../common/helpers/handle-exception';
import { QueryLevelDto } from './dto/query-level.dto';
import { PaginationService } from '../common/services/pagination.service';

@Injectable()
export class LevelsService {
  constructor(
    @InjectModel(Level.name)
    private readonly levelModel: Model<Level>,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createLevelDto: CreateLevelDto) {
    try {
      return await this.levelModel.create(createLevelDto);
    } catch (error) {
      handleExceptions(error, 'Level');
    }
  }

  // async findAll(queryPaginateDto: QueryPaginateDto) {
  //   const { search, limit, offset, sort } = queryPaginateDto;
  //   const filters: any = {};

  //   if (search) {
  //     const searchRegex = new RegExp(search, 'i');
  //     filters.$or = [{ name: searchRegex }];
  //   }

  //   const mongooseQuery = this.levelModel.find(filters);
  //   mongooseQuery.select('-__v');

  //   if (limit) {
  //     mongooseQuery.limit(limit);
  //   }

  //   if (offset) {
  //     mongooseQuery.skip(offset);
  //   }

  //   if (sort) {
  //     mongooseQuery.sort(sort.replace(/,/g, ' '));
  //   }

  //   return mongooseQuery.exec();
  // }
  async findAll(queryLevelDto: QueryLevelDto) {
    // Si hay filtros específicos para levels, se agrega aquí:
    const baseFilters: any = {};

    // Ejemplo de filtros específicos:
    // if (queryLevelDto.status) {
    //   baseFilters.status = queryLevelDto.status;
    // }

    // Configuración específica para el modelo Level
    const paginationOptions = {
      searchFields: ['name'], // Ajustar según los campos del modelo
      defaultSort: 'name', // Ordenamiento por defecto
      selectFields: '-__v', // campos a excluir
    };

    return this.paginationService.paginate(
      this.levelModel,
      queryLevelDto,
      baseFilters,
      paginationOptions,
    );
  }

  async findOne(term: string) {
    let level: Level | null = null;

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
