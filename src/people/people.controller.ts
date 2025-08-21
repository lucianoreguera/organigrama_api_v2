import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { PeopleService } from './people.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PersonResponseDto } from './dto/person-response.dto';
import { PaginatedPeopleResponseDto } from './dto/paginated-people-response.dto';
import { ParseMongoIdPipe } from '../common/pipes/parse-mongo-id.pipe';
import { QueryPersonDto } from './dto/query-person.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Personas')
@Controller('people')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('JWT-auth')
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  // @Post()
  // @HttpCode(HttpStatus.CREATED)
  // @ApiOperation({
  //   summary: 'Crear una nueva persona',
  //   description:
  //     'Registra una nueva persona en el sistema. El tipo determina qué campos adicionales son requeridos.',
  // })
  // @ApiBody({
  //   type: CreatePersonDto,
  //   description: 'Datos de la persona a crear',
  // })
  // @ApiResponse({
  //   status: 201,
  //   description: 'Persona creada exitosamente',
  //   type: PersonResponseDto,
  // })
  // @ApiResponse({
  //   status: 400,
  //   description: 'Datos de entrada inválidos',
  //   schema: {
  //     example: {
  //       statusCode: 400,
  //       message: [
  //         'El nombre es requerido',
  //         'El CUIL debe tener el formato XX-XXXXXXXX-X',
  //         'El título del puesto es requerido para un funcionario',
  //       ],
  //       error: 'Bad Request',
  //     },
  //   },
  // })
  // @ApiResponse({
  //   status: 401,
  //   description: 'Token de autenticación requerido o inválido',
  // })
  // @ApiResponse({
  //   status: 409,
  //   description: 'Ya existe una persona con ese CUIL',
  //   schema: {
  //     example: {
  //       statusCode: 409,
  //       message: 'Ya existe una persona registrada con el CUIL "20-12345678-9"',
  //       error: 'Conflict',
  //     },
  //   },
  // })
  // create(@Body() createPersonDto: CreatePersonDto) {
  //   return this.peopleService.create(createPersonDto);
  // }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Crear una nueva persona',
    description:
      'Registra una nueva persona en el sistema. El tipo determina qué campos adicionales son requeridos. Opcionalmente puede incluir una foto.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstname: {
          type: 'string',
          description: 'Nombre de la persona',
          example: 'Juan Carlos',
          maxLength: 100,
        },
        lastname: {
          type: 'string',
          description: 'Apellido de la persona',
          example: 'Pérez González',
          maxLength: 100,
        },
        cuil: {
          type: 'string',
          description: 'CUIL de la persona en formato XX-XXXXXXXX-X',
          example: '20-12345678-9',
          pattern: '^\\d{2}-\\d{8}-\\d{1}$',
        },
        person_type: {
          type: 'string',
          enum: ['OFFICIAL', 'ASSESSOR'],
          description: 'Tipo de persona en el sistema',
          example: 'OFFICIAL',
        },
        email: {
          type: 'string',
          format: 'email',
          description: 'Correo electrónico de la persona',
          example: 'juan.perez@gobierno.ar',
          maxLength: 100,
        },
        phone_number: {
          type: 'string',
          description: 'Número de teléfono de contacto',
          example: '+54 9 383 123-4567',
          maxLength: 20,
        },
        bio: {
          type: 'string',
          description: 'Biografía o descripción de la persona',
          example: 'Funcionario con más de 10 años de experiencia...',
        },
        job_title_text: {
          type: 'string',
          description: 'Título del puesto (requerido solo para funcionarios)',
          example: 'Jefe de Departamento de Recursos Humanos',
          maxLength: 150,
        },
        expertise_area: {
          type: 'string',
          description: 'Área de especialización (requerido solo para asesores)',
          example: 'Derecho Administrativo y Gestión Pública',
          maxLength: 150,
        },
        is_active: {
          type: 'boolean',
          description: 'Indica si la persona está activa en el sistema',
          example: true,
          default: true,
        },
        social_networks: {
          type: 'object',
          description: 'Redes sociales de la persona',
          properties: {
            facebook: { type: 'string' },
            twitter: { type: 'string' },
            linkedin: { type: 'string' },
            instagram: { type: 'string' },
          },
        },
        photo: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de imagen para la foto de perfil (opcional)',
          nullable: true,
        },
      },
      required: ['firstname', 'lastname', 'cuil', 'person_type'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Persona creada exitosamente',
    type: PersonResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'El nombre es requerido',
          'El CUIL debe tener el formato XX-XXXXXXXX-X',
          'El título del puesto es requerido para un funcionario',
        ],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticación requerido o inválido',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una persona con ese CUIL',
    schema: {
      example: {
        statusCode: 409,
        message: 'Ya existe una persona registrada con el CUIL "20-12345678-9"',
        error: 'Conflict',
      },
    },
  })
  create(
    @Body() createPersonDto: CreatePersonDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: 'image/(jpeg|png|webp|gif)' }),
        ],
        fileIsRequired: false,
      }),
    )
    photo?: Express.Multer.File,
  ) {
    return this.peopleService.create(createPersonDto, photo);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las personas',
    description:
      'Retorna una lista paginada de personas con opciones avanzadas de filtrado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de personas obtenida exitosamente',
    type: PaginatedPeopleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticación requerido o inválido',
  })
  findAll(@Query() queryPersonDto: QueryPersonDto) {
    return this.peopleService.findAll(queryPersonDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener persona por ID',
    description: 'Busca una persona específica por su ID de MongoDB',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la persona en formato MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Persona encontrada exitosamente',
    type: PersonResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'ID de MongoDB inválido',
    schema: {
      example: {
        statusCode: 400,
        message: 'ID de MongoDB inválido',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticación requerido o inválido',
  })
  @ApiResponse({
    status: 404,
    description: 'Persona no encontrada',
    schema: {
      example: {
        statusCode: 404,
        message: 'Persona con ID "507f1f77bcf86cd799439011" no encontrada',
        error: 'Not Found',
      },
    },
  })
  findOne(@Param('id', ParseMongoIdPipe) id: string) {
    return this.peopleService.findOne(id);
  }

  // @Patch(':id')
  // @ApiOperation({
  //   summary: 'Actualizar una persona',
  //   description:
  //     'Actualiza parcialmente los datos de una persona. Si se cambia el tipo, se validarán los campos correspondientes.',
  // })
  // @ApiParam({
  //   name: 'id',
  //   description: 'ID único de la persona en formato MongoDB ObjectId',
  //   example: '507f1f77bcf86cd799439011',
  // })
  // @ApiBody({
  //   type: UpdatePersonDto,
  //   description:
  //     'Datos de la persona a actualizar (todos los campos son opcionales)',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Persona actualizada exitosamente',
  //   type: PersonResponseDto,
  // })
  // @ApiResponse({
  //   status: 400,
  //   description: 'Datos de entrada inválidos o ID de MongoDB inválido',
  // })
  // @ApiResponse({
  //   status: 401,
  //   description: 'Token de autenticación requerido o inválido',
  // })
  // @ApiResponse({
  //   status: 404,
  //   description: 'Persona no encontrada',
  // })
  // @ApiResponse({
  //   status: 409,
  //   description: 'El CUIL ya está en uso por otra persona',
  //   schema: {
  //     example: {
  //       statusCode: 409,
  //       message:
  //         'El CUIL "20-12345678-9" ya está siendo utilizado por otra persona',
  //       error: 'Conflict',
  //     },
  //   },
  // })
  // update(
  //   @Param('id', ParseMongoIdPipe) id: string,
  //   @Body() updatePersonDto: UpdatePersonDto,
  // ) {
  //   return this.peopleService.update(id, updatePersonDto);
  // }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Actualizar una persona',
    description:
      'Actualiza parcialmente los datos de una persona. Si se cambia el tipo, se validarán los campos correspondientes. Opcionalmente puede incluir una nueva foto.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la persona en formato MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstname: {
          type: 'string',
          description: 'Nombre de la persona',
          example: 'Juan Carlos',
          maxLength: 100,
        },
        lastname: {
          type: 'string',
          description: 'Apellido de la persona',
          example: 'Pérez González',
          maxLength: 100,
        },
        cuil: {
          type: 'string',
          description: 'CUIL de la persona en formato XX-XXXXXXXX-X',
          example: '20-12345678-9',
          pattern: '^\\d{2}-\\d{8}-\\d{1}$',
        },
        person_type: {
          type: 'string',
          enum: ['OFFICIAL', 'ASSESSOR'],
          description: 'Tipo de persona en el sistema',
          example: 'OFFICIAL',
        },
        email: {
          type: 'string',
          format: 'email',
          description: 'Correo electrónico de la persona',
          example: 'juan.perez@gobierno.ar',
          maxLength: 100,
        },
        phone_number: {
          type: 'string',
          description: 'Número de teléfono de contacto',
          example: '+54 9 383 123-4567',
          maxLength: 20,
        },
        bio: {
          type: 'string',
          description: 'Biografía o descripción de la persona',
          example: 'Funcionario con más de 10 años de experiencia...',
        },
        job_title_text: {
          type: 'string',
          description: 'Título del puesto (requerido solo para funcionarios)',
          example: 'Jefe de Departamento de Recursos Humanos',
          maxLength: 150,
        },
        expertise_area: {
          type: 'string',
          description: 'Área de especialización (requerido solo para asesores)',
          example: 'Derecho Administrativo y Gestión Pública',
          maxLength: 150,
        },
        is_active: {
          type: 'boolean',
          description: 'Indica si la persona está activa en el sistema',
          example: true,
        },
        social_networks: {
          type: 'object',
          description: 'Redes sociales de la persona',
          properties: {
            facebook: { type: 'string' },
            twitter: { type: 'string' },
            linkedin: { type: 'string' },
            instagram: { type: 'string' },
          },
        },
        photo: {
          type: 'string',
          format: 'binary',
          description:
            'Nuevo archivo de imagen para la foto de perfil (opcional)',
          nullable: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Persona actualizada exitosamente',
    type: PersonResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos o ID de MongoDB inválido',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticación requerido o inválido',
  })
  @ApiResponse({
    status: 404,
    description: 'Persona no encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'El CUIL ya está en uso por otra persona',
    schema: {
      example: {
        statusCode: 409,
        message:
          'El CUIL "20-12345678-9" ya está siendo utilizado por otra persona',
        error: 'Conflict',
      },
    },
  })
  update(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updatePersonDto: UpdatePersonDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: 'image/(jpeg|png|webp|gif)' }),
        ],
        fileIsRequired: false,
      }),
    )
    photo?: Express.Multer.File,
  ) {
    return this.peopleService.update(id, updatePersonDto, photo);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar una persona',
    description: 'Elimina permanentemente una persona del sistema',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la persona en formato MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 204,
    description: 'Persona eliminada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'ID de MongoDB inválido',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticación requerido o inválido',
  })
  @ApiResponse({
    status: 404,
    description: 'Persona no encontrada',
  })
  @ApiResponse({
    status: 409,
    description:
      'No se puede eliminar la persona porque está siendo utilizada en otros registros',
    schema: {
      example: {
        statusCode: 409,
        message:
          'No se puede eliminar la persona porque está asociada a cursos o proyectos activos',
        error: 'Conflict',
      },
    },
  })
  remove(@Param('id', ParseMongoIdPipe) id: string) {
    return this.peopleService.remove(id);
  }

  @Patch(':id/photo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photo: {
          type: 'string',
          format: 'binary',
          description: 'Nuevo archivo de imagen.',
          nullable: false,
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Subir un archivo',
    description: 'Sube un archivo a S3',
  })
  @ApiResponse({
    status: 201,
    description: 'Archivo subido exitosamente',
    type: String,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticación requerido o inválido',
  })
  upload(
    @Param('id', ParseMongoIdPipe) id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: 'image/(jpeg|png|webp|gif)' }),
        ],
        fileIsRequired: false,
      }),
    )
    photo: Express.Multer.File,
  ) {
    return this.peopleService.upload(id, photo);
  }
}
