import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
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
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentResponseDto } from './dto/department-response.dto';
import { PaginatedDepartmentsResponseDto } from './dto/paginated-departments-response.dto';
import { QueryDepartmentDto } from './dto/query-department.dto';
import { ParseMongoIdPipe } from '../common/pipes/parse-mongo-id.pipe';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Departamentos')
@Controller('departments')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('JWT-auth')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo departamento',
    description:
      'Crea un nuevo departamento en el sistema con información básica, ubicación y configuración',
  })
  @ApiBody({
    type: CreateDepartmentDto,
    description: 'Datos del departamento a crear',
  })
  @ApiResponse({
    status: 201,
    description: 'Departamento creado exitosamente',
    type: DepartmentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'El nombre del departamento es requerido',
          'El código no puede exceder los 50 caracteres',
          'Las coordenadas deben tener exactamente 2 elementos',
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
    description: 'Ya existe un departamento con ese nombre o código',
    schema: {
      example: {
        statusCode: 409,
        message: 'Ya existe un departamento con el nombre "Recursos Humanos"',
        error: 'Conflict',
      },
    },
  })
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los departamentos',
    description:
      'Retorna una lista paginada de departamentos con opciones de filtrado por nombre, código y estado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de departamentos obtenida exitosamente',
    type: PaginatedDepartmentsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticación requerido o inválido',
  })
  findAll(@Query() queryDepartmentDto: QueryDepartmentDto) {
    return this.departmentsService.findAll(queryDepartmentDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener departamento por ID',
    description: 'Busca un departamento específico por su ID de MongoDB',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del departamento en formato MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Departamento encontrado exitosamente',
    type: DepartmentResponseDto,
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
    description: 'Departamento no encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Departamento con ID "507f1f77bcf86cd799439011" no encontrado',
        error: 'Not Found',
      },
    },
  })
  findOne(@Param('id', ParseMongoIdPipe) id: string) {
    return this.departmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un departamento',
    description:
      'Actualiza parcialmente los datos de un departamento existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del departamento en formato MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    type: UpdateDepartmentDto,
    description:
      'Datos del departamento a actualizar (todos los campos son opcionales)',
  })
  @ApiResponse({
    status: 200,
    description: 'Departamento actualizado exitosamente',
    type: DepartmentResponseDto,
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
    description: 'Departamento no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'El nombre o código del departamento ya está en uso',
    schema: {
      example: {
        statusCode: 409,
        message:
          'El código "RRHH-01" ya está siendo utilizado por otro departamento',
        error: 'Conflict',
      },
    },
  })
  update(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  @Patch(':id/change-status')
  @ApiOperation({
    summary: 'Cambiar estado del departamento',
    description:
      'Alterna el estado activo/inactivo del departamento. No elimina el registro, solo cambia su estado.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del departamento en formato MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del departamento cambiado exitosamente',
    type: DepartmentResponseDto,
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        name: 'Departamento de Recursos Humanos',
        is_active: false,
        updatedAt: '2024-01-20T15:45:00Z',
      },
    },
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
    description: 'Departamento no encontrado',
  })
  @ApiResponse({
    status: 409,
    description:
      'No se puede desactivar el departamento porque tiene dependencias activas',
    schema: {
      example: {
        statusCode: 409,
        message:
          'No se puede desactivar el departamento porque tiene empleados asignados',
        error: 'Conflict',
      },
    },
  })
  remove(@Param('id', ParseMongoIdPipe) id: string) {
    return this.departmentsService.changeStatus(id);
  }
}
