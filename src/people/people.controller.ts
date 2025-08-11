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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PeopleService } from './people.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PersonResponseDto } from './dto/person-response.dto';
import { PaginatedPeopleResponseDto } from './dto/paginated-people-response.dto';
import { ParseMongoIdPipe } from '../common/pipes/parse-mongo-id.pipe';
import { QueryPersonDto } from './dto/query-person.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Personas')
@Controller('people')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('JWT-auth')
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una nueva persona',
    description:
      'Registra una nueva persona en el sistema. El tipo determina qué campos adicionales son requeridos.',
  })
  @ApiBody({
    type: CreatePersonDto,
    description: 'Datos de la persona a crear',
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
  create(@Body() createPersonDto: CreatePersonDto) {
    return this.peopleService.create(createPersonDto);
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

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar una persona',
    description:
      'Actualiza parcialmente los datos de una persona. Si se cambia el tipo, se validarán los campos correspondientes.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la persona en formato MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    type: UpdatePersonDto,
    description:
      'Datos de la persona a actualizar (todos los campos son opcionales)',
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
  ) {
    return this.peopleService.update(id, updatePersonDto);
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
}
