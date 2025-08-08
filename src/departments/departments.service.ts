import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { isValidObjectId, Model } from 'mongoose';
import { Department } from './entities/department.entity';
import { InjectModel } from '@nestjs/mongoose';
import { handleExceptions } from 'src/common/helpers/handle-exception';
import { QueryPaginateDto } from '../common/dto/query-paginate.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectModel(Department.name)
    private readonly departmentModel: Model<Department>,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    try {
      return await this.departmentModel.create(createDepartmentDto);
    } catch (error) {
      handleExceptions(error, 'Department');
    }
  }

  findAll(queryPaginateDto: QueryPaginateDto) {
    const { search, limit, offset, sort } = queryPaginateDto;
    const filters: any = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filters.$or = [{ name: searchRegex }];
    }

    const mongooseQuery = this.departmentModel.find(filters);
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

  async findOne(id: string) {
    let department: Department | null = null;

    if (isValidObjectId(id)) {
      department = await this.departmentModel.findById(id);
    }

    if (!department)
      throw new NotFoundException(
        `Department with "id" or "name" ${id} not found`,
      );

    return department;
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    const department = await this.findOne(id);

    if (updateDepartmentDto.name) updateDepartmentDto.name.toLowerCase();
    if (updateDepartmentDto.objective)
      updateDepartmentDto.objective.toLowerCase();
    if (updateDepartmentDto.address_text)
      updateDepartmentDto.address_text.toLowerCase();

    try {
      await department.updateOne(updateDepartmentDto);
      return { ...department.toJSON(), ...updateDepartmentDto };
    } catch (error) {
      handleExceptions(error, 'Department');
    }
  }

  async changeStatus(id: string) {
    const department = await this.findOne(id);
    department.is_active = !department.is_active;
    await department.save();
    return department;
  }

  async findByName(name: string) {
    return await this.departmentModel.findOne({ name: name.toLowerCase() });
  }

  async findByCode(code: string) {
    return await this.departmentModel.findOne({ code: code.toLowerCase() });
  }
}
