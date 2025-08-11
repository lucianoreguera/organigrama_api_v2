import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LevelsService } from './levels.service';
import { CreateLevelDto } from './dto/create-level.dto';
import { UpdateLevelDto } from './dto/update-level.dto';
import { LevelResponseDto } from './dto/level-response.dto';
import { PaginatedLevelsResponseDto } from './dto/paginated-levels-response.dto';
import { ParseMongoIdPipe } from '../common/pipes/parse-mongo-id.pipe';
import { QueryLevelDto } from './dto/query-level.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Niveles')
@Controller('levels')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('JWT-auth')
export class LevelsController {
  constructor(private readonly levelsService: LevelsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo nivel',
    description:
      'Crea un nuevo nivel en el sistema con la información proporcionada',
  })
  @ApiBody({
    type: CreateLevelDto,
    description: 'Datos del nivel a crear',
  })
  @ApiResponse({
    status: 201,
    description: 'Nivel creado exitosamente',
    type: LevelResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    schema: {
      example: {
        statusCode: 400,
        message: ['El nombre debe tener al menos 3 caracteres'],
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
    description: 'Ya existe un nivel con ese nombre',
    schema: {
      example: {
        statusCode: 409,
        message: 'Ya existe un nivel con el nombre "Principiante"',
        error: 'Conflict',
      },
    },
  })
  create(@Body() createLevelDto: CreateLevelDto) {
    return this.levelsService.create(createLevelDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los niveles',
    description:
      'Retorna una lista paginada de niveles con opciones de filtrado y ordenamiento',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de niveles obtenida exitosamente',
    type: PaginatedLevelsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticación requerido o inválido',
  })
  findAll(@Query() queryLevelDto: QueryLevelDto) {
    return this.levelsService.findAll(queryLevelDto);
  }

  @Get(':term')
  @ApiOperation({
    summary: 'Obtener nivel por ID o nombre',
    description:
      'Busca un nivel específico por su ID de MongoDB o por su nombre exacto',
  })
  @ApiParam({
    name: 'term',
    description: 'ID de MongoDB o nombre exacto del nivel',
    example: '507f1f77bcf86cd799439011',
    examples: {
      byId: {
        value: '507f1f77bcf86cd799439011',
        description: 'Búsqueda por ID de MongoDB',
      },
      byName: {
        value: 'Principiante',
        description: 'Búsqueda por nombre exacto',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Nivel encontrado exitosamente',
    type: LevelResponseDto,
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
    description: 'Nivel no encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Nivel con ID "507f1f77bcf86cd799439011" no encontrado',
        error: 'Not Found',
      },
    },
  })
  findOne(@Param('term') term: string) {
    return this.levelsService.findOne(term);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un nivel',
    description: 'Actualiza parcialmente los datos de un nivel existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del nivel en formato MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    type: UpdateLevelDto,
    description:
      'Datos del nivel a actualizar (todos los campos son opcionales)',
  })
  @ApiResponse({
    status: 200,
    description: 'Nivel actualizado exitosamente',
    type: LevelResponseDto,
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
    description: 'Nivel no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'El nombre del nivel ya está en uso por otro nivel',
  })
  update(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updateLevelDto: UpdateLevelDto,
  ) {
    return this.levelsService.update(id, updateLevelDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar un nivel',
    description: 'Elimina permanentemente un nivel del sistema',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del nivel en formato MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 204,
    description: 'Nivel eliminado exitosamente',
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
    description: 'Nivel no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'No se puede eliminar el nivel porque está siendo utilizado',
    schema: {
      example: {
        statusCode: 409,
        message:
          'No se puede eliminar el nivel porque está asociado a cursos existentes',
        error: 'Conflict',
      },
    },
  })
  remove(@Param('id', ParseMongoIdPipe) id: string) {
    return this.levelsService.remove(id);
  }
}
