import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { Person } from './entities/person.entity';
import { handleExceptions } from '../common/helpers/handle-exception';
import { QueryPaginateDto } from '../common/dto/query-paginate.dto';

@Injectable()
export class PeopleService {
  private defaultLimit: number;

  constructor(
    @InjectModel(Person.name)
    private readonly peopleModel: Model<Person>,
    private readonly configService: ConfigService,
  ) {
    this.defaultLimit = this.configService.get<number>('defaultLimit')!;
  }

  async create(createPersonDto: CreatePersonDto) {
    try {
      return await this.peopleModel.create(createPersonDto);
    } catch (error) {
      handleExceptions(error, 'Person');
    }
  }

  async findAll(queryPaginateDto: QueryPaginateDto) {
    const { search, limit, offset, sort } = queryPaginateDto;
    const filters: any = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      console.log(searchRegex);
      filters.$or = [{ cuil: searchRegex }, { lastname: searchRegex }];
    }

    const mongooseQuery = this.peopleModel.find(filters);
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
    const person = await this.peopleModel.findById(id);
    if (!person) throw new NotFoundException(`Person with id ${id} not found`);
    return person;
  }

  async update(id: string, updatePersonDto: UpdatePersonDto) {
    const person = await this.findOne(id);
    if (updatePersonDto.firstname) updatePersonDto.firstname.toLowerCase();
    if (updatePersonDto.lastname) updatePersonDto.lastname.toLowerCase();
    if (updatePersonDto.cuil) updatePersonDto.cuil.toLowerCase();
    if (updatePersonDto.email) updatePersonDto.email.toLowerCase();
    if (updatePersonDto.job_title_text)
      updatePersonDto.job_title_text.toLowerCase();
    if (updatePersonDto.expertise_area)
      updatePersonDto.expertise_area.toLowerCase();

    try {
      await person.updateOne(updatePersonDto);
      return { ...person.toJSON(), ...updatePersonDto };
    } catch (error) {
      handleExceptions(error, 'Person');
    }
  }

  async remove(id: string) {
    const { deletedCount } = await this.peopleModel.deleteOne({ _id: id });
    if (deletedCount === 0)
      throw new NotFoundException(`Person with id ${id} not found`);
    return;
  }
}
