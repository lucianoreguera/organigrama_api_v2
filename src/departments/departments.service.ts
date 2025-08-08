import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { isValidObjectId, Model } from 'mongoose';
import { Department } from './entities/department.entity';
import { InjectModel } from '@nestjs/mongoose';
import { handleExceptions } from 'src/common/helpers/handle-exception';
import { QueryDepartmentDto } from './dto/query-department.dto';
import { PaginationService } from '../common/services/pagination.service';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectModel(Department.name)
    private readonly departmentModel: Model<Department>,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    try {
      return await this.departmentModel.create(createDepartmentDto);
    } catch (error) {
      handleExceptions(error, 'Department');
    }
  }

  findAll(queryDepartmentDto: QueryDepartmentDto) {
    const baseFilters: any = {};

    const paginationOptions = {
      searchFields: ['name'], // Ajustar según los campos del modelo
      defaultSort: 'name', // Ordenamiento por defecto
      selectFields: '-__v', // campos a excluir
    };

    return this.paginationService.paginate(
      this.departmentModel,
      queryDepartmentDto,
      baseFilters,
      paginationOptions,
    );
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
