import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { Person } from './entities/person.entity';
import { handleExceptions } from '../common/helpers/handle-exception';
import { QueryPersonDto } from './dto/query-person.dto';
import { PaginationService } from '../common/services/pagination.service';
import { FileUploadService } from '../common/services/file-upload.service';

@Injectable()
export class PeopleService {
  private readonly logger = new Logger(PeopleService.name);
  constructor(
    @InjectModel(Person.name)
    private readonly peopleModel: Model<Person>,
    private readonly paginationService: PaginationService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async create(createPersonDto: CreatePersonDto) {
    try {
      return await this.peopleModel.create(createPersonDto);
    } catch (error) {
      handleExceptions(error, 'Person');
    }
  }

  findAll(queryPersonDto: QueryPersonDto) {
    const baseFilters: any = {};

    const paginationOptions = {
      searchFields: ['lastname', 'cuil'], // Ajustar según los campos del modelo
      defaultSort: 'lastname', // Ordenamiento por defecto
      selectFields: '-__v', // campos a excluir
    };

    return this.paginationService.paginate(
      this.peopleModel,
      queryPersonDto,
      baseFilters,
      paginationOptions,
    );
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

  async upload(id: string, photo: Express.Multer.File) {
    const person = await this.findOne(id);
    let photoUrlToUpdate: string | undefined | null = undefined;

    try {
      const cuilForFileName = person.cuil;
      photoUrlToUpdate = await this.fileUploadService.uploadFile(
        photo,
        cuilForFileName,
      );
    } catch (uploadError) {
      this.logger.error(
        `Error al subir la nueva foto: ${uploadError.message}`,
        uploadError.stack,
      );
      throw new InternalServerErrorException(
        `Error al procesar la nueva foto: ${uploadError.message}`,
      );
    }
    person.photo_url = photoUrlToUpdate;
    await person.save();
    return person;
  }
}
