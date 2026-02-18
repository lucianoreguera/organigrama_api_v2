import { Controller, Get, Param, UseInterceptors, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PublicOrganigramService } from './public-organigram.service';
import { CacheWarmingService } from './cache-warming.service';
import { HttpCacheInterceptor } from '../common/interceptors/http-cache.interceptor';
import {
  SecretariaResponseDto,
  DepartmentFlatResponseDto,
} from './dto/public-organigram.dto';
import { ParseMongoIdPipe } from '../common/pipes/parse-mongo-id.pipe';

@ApiTags('Público - Organigrama')
@Controller('public/organigrama')
@UseInterceptors(HttpCacheInterceptor)
export class PublicOrganigramController {
  constructor(
    private readonly publicOrganigramService: PublicOrganigramService,
    private readonly cacheWarmingService: CacheWarmingService,
  ) {}

  @Get('secretarias')
  @ApiOperation({
    summary: 'Listar todas las secretarías',
    description:
      'Obtiene una lista de todas las secretarías del organigrama activo. Resultado en cache por 1 hora.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de secretarías obtenida exitosamente',
    type: [SecretariaResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontró una versión activa del organigrama',
    schema: {
      example: {
        statusCode: 404,
        message: 'No hay una versión activa del organigrama',
        error: 'Not Found',
      },
    },
  })
  async getAllSecretarias(): Promise<SecretariaResponseDto[]> {
    return this.publicOrganigramService.getAllSecretarias();
  }

  @Get('secretarias/:id/hijos')
  @ApiOperation({
    summary: 'Listar todos los hijos de una secretaría',
    description:
      'Obtiene una lista plana de todos los departamentos descendientes de una secretaría específica. Resultado en cache por 1 hora.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del nodo de la secretaría',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de departamentos obtenida exitosamente',
    type: [DepartmentFlatResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'ID de secretaría inválido',
    schema: {
      example: {
        statusCode: 400,
        message: 'ID inválido',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Secretaría no encontrada o el nodo no es una secretaría',
    schema: {
      example: {
        statusCode: 404,
        message:
          'El nodo 507f1f77bcf86cd799439011 no corresponde a una secretaría',
        error: 'Not Found',
      },
    },
  })
  async getSecretariaChildren(
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<DepartmentFlatResponseDto[]> {
    return this.publicOrganigramService.getSecretariaChildren(id);
  }

  @Get('nodos/:nodeId/departamento-info')
  @ApiOperation({
    summary: 'Obtener nombre del departamento y nivel de un nodo',
    description:
      'Retorna únicamente el nombre del departamento y el nombre del nivel jerárquico del nodo especificado.',
  })
  @ApiParam({
    name: 'nodeId',
    description: 'ID del nodo de departamento',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({
    status: 200,
    description: 'Información obtenida exitosamente.',
    schema: {
      type: 'object',
      properties: {
        department_name: { type: 'string', example: 'Secretaría de Educación' },
        level_name: { type: 'string', example: 'Secretaría' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Nodo no encontrado.' })
  async getDepartmentInfoByNodeId(
    @Param('nodeId', ParseMongoIdPipe) nodeId: string,
  ) {
    return this.publicOrganigramService.getDepartmentInfoByNodeId(nodeId);
  }
}
