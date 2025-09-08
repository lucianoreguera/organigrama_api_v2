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

  // async create(createPersonDto: CreatePersonDto) {
  //   try {
  //     return await this.peopleModel.create(createPersonDto);
  //   } catch (error) {
  //     handleExceptions(error, 'Person');
  //   }
  // }

  async create(createPersonDto: CreatePersonDto, photo?: Express.Multer.File) {
    try {
      let photoUrl: string | undefined = undefined;

      // Si se proporciona una foto, subirla a S3 primero
      if (photo) {
        try {
          this.logger.log(
            `Subiendo foto para nueva persona con CUIL: ${createPersonDto.cuil}`,
          );
          photoUrl = await this.fileUploadService.uploadFile(
            photo,
            createPersonDto.cuil,
          );
          this.logger.log(`Foto subida exitosamente: ${photoUrl}`);
        } catch (uploadError) {
          this.logger.error(
            `Error al subir la foto durante la creación: ${uploadError.message}`,
            uploadError.stack,
          );
          // Decidir si fallar completamente o crear sin foto
          // En este caso, fallamos completamente para mantener consistencia
          throw new InternalServerErrorException(
            `Error al procesar la foto: ${uploadError.message}`,
          );
        }
      }

      // Crear el objeto person con la URL de la foto si existe
      const personData = {
        ...createPersonDto,
        photo_url: photoUrl,
      };

      const createdPerson = await this.peopleModel.create(personData);
      this.logger.log(
        `Persona creada exitosamente con ID: ${createdPerson._id}`,
      );

      return createdPerson;
    } catch (error) {
      // Si hubo error después de subir la foto, idealmente deberíamos eliminarla
      // Esto requeriría un método deleteFile en el FileUploadService
      // Por ahora, solo loggeamos el error
      if (photo) {
        this.logger.warn(
          'Se subió una foto pero falló la creación de la persona. Considera implementar limpieza de archivos huérfanos.',
        );
      }

      handleExceptions(error, 'Person');
    }
  }

  findAll(queryPersonDto: QueryPersonDto) {
    const baseFilters: any = {};

    const paginationOptions = {
      searchFields: ['lastname', 'cuil', 'person_type'], // campos a buscar
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

  // async update(id: string, updatePersonDto: UpdatePersonDto) {
  //   const person = await this.findOne(id);
  //   if (updatePersonDto.firstname) updatePersonDto.firstname.toLowerCase();
  //   if (updatePersonDto.lastname) updatePersonDto.lastname.toLowerCase();
  //   if (updatePersonDto.cuil) updatePersonDto.cuil.toLowerCase();
  //   if (updatePersonDto.email) updatePersonDto.email.toLowerCase();
  //   if (updatePersonDto.job_title_text)
  //     updatePersonDto.job_title_text.toLowerCase();
  //   if (updatePersonDto.expertise_area)
  //     updatePersonDto.expertise_area.toLowerCase();

  //   try {
  //     await person.updateOne(updatePersonDto);
  //     return { ...person.toJSON(), ...updatePersonDto };
  //   } catch (error) {
  //     handleExceptions(error, 'Person');
  //   }
  // }

  async update(
    id: string,
    updatePersonDto: UpdatePersonDto,
    photo?: Express.Multer.File,
  ) {
    const person = await this.findOne(id);

    // Aplicar transformaciones lowercase a los campos de texto
    if (updatePersonDto.firstname)
      updatePersonDto.firstname = updatePersonDto.firstname.toLowerCase();
    if (updatePersonDto.lastname)
      updatePersonDto.lastname = updatePersonDto.lastname.toLowerCase();
    if (updatePersonDto.cuil)
      updatePersonDto.cuil = updatePersonDto.cuil.toLowerCase();
    if (updatePersonDto.email)
      updatePersonDto.email = updatePersonDto.email.toLowerCase();
    if (updatePersonDto.job_title_text)
      updatePersonDto.job_title_text =
        updatePersonDto.job_title_text.toLowerCase();
    if (updatePersonDto.expertise_area)
      updatePersonDto.expertise_area =
        updatePersonDto.expertise_area.toLowerCase();

    let photoUrl: string | undefined = undefined;
    let oldPhotoUrl: string | undefined = person.photo_url;

    // Si se proporciona una nueva foto, subirla a S3 primero
    if (photo) {
      try {
        // Usar el CUIL actual de la persona (puede haber cambiado en updatePersonDto)
        const cuilForFileName = updatePersonDto.cuil || person.cuil;
        this.logger.log(
          `Subiendo nueva foto para persona con CUIL: ${cuilForFileName}`,
        );

        photoUrl = await this.fileUploadService.uploadFile(
          photo,
          cuilForFileName,
        );
        this.logger.log(`Nueva foto subida exitosamente: ${photoUrl}`);

        // Añadir la nueva URL al DTO de actualización
        updatePersonDto.photo_url = photoUrl;
      } catch (uploadError) {
        this.logger.error(
          `Error al subir la nueva foto: ${uploadError.message}`,
          uploadError.stack,
        );
        throw new InternalServerErrorException(
          `Error al procesar la nueva foto: ${uploadError.message}`,
        );
      }
    }

    try {
      // Actualizar la persona con los nuevos datos
      await person.updateOne(updatePersonDto);

      // Obtener la persona actualizada para devolverla
      const updatedPerson = await this.peopleModel.findById(id);

      this.logger.log(`Persona actualizada exitosamente con ID: ${id}`);

      // TODO: Implementar limpieza de la foto anterior si se subió una nueva
      // Esto requeriría un método deleteFile en el FileUploadService
      if (photo && oldPhotoUrl && oldPhotoUrl !== photoUrl) {
        this.logger.log(`Foto anterior pendiente de limpieza: ${oldPhotoUrl}`);
      }

      return updatedPerson;
    } catch (error) {
      // Si hubo error después de subir la nueva foto, idealmente deberíamos eliminarla
      if (photo && photoUrl) {
        this.logger.warn(
          'Se subió una nueva foto pero falló la actualización de la persona. Considera implementar limpieza de archivos huérfanos.',
        );
      }

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
