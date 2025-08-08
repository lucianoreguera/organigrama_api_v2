import { Injectable } from '@nestjs/common';
import { Model, FilterQuery } from 'mongoose';
import { PaginationDto } from '../dto/pagination.dto';
import {
  PaginatedResponse,
  PaginationMeta,
} from '../interfaces/paginated-response.interface';

export interface PaginationOptions {
  searchFields?: string[];
  defaultSort?: string;
  selectFields?: string;
}

@Injectable()
export class PaginationService {
  async paginate<T>(
    model: Model<T>,
    paginationDto: PaginationDto,
    baseFilters: FilterQuery<T> = {},
    options: PaginationOptions = {},
  ): Promise<PaginatedResponse<T>> {
    const { page = 1, limit = 10, sort, search } = paginationDto;

    const {
      searchFields = ['name'],
      defaultSort = '-createdAt',
      selectFields = '-__v',
    } = options;

    const filters: FilterQuery<T> = { ...baseFilters };

    if (search && searchFields.length > 0) {
      const searchRegex = new RegExp(search, 'i');
      filters.$or = searchFields.map((field) => ({
        [field]: searchRegex,
      })) as FilterQuery<T>[];
    }

    const offset = (page - 1) * limit;
    const totalItems = await model.countDocuments(filters);
    const paginationMeta = this.calculatePaginationMeta(
      page,
      limit,
      totalItems,
    );

    const query = model.find(filters);

    if (selectFields) {
      query.select(selectFields);
    }

    query.limit(limit);
    query.skip(offset);

    const sortField = sort || defaultSort;
    if (sortField) {
      query.sort(sortField.replace(/,/g, ' '));
    }

    const data = await query.exec();

    return {
      data,
      pagination: paginationMeta,
    };
  }

  private calculatePaginationMeta(
    page: number,
    limit: number,
    totalItems: number,
  ): PaginationMeta {
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null,
    };
  }
}
