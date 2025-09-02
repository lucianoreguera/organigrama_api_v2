import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
  Param,
  Patch,
  Query,
  Delete,
} from '@nestjs/common';
import { OrganigramVersionsService } from './organigrams_version.service';
import {
  CreateOrganigramVersionDto,
  OrganigramNodeDto,
  OrganigramStructureResponseDto,
  AssignResponsibleOfficialDto,
  AssignResponsibleOfficialBodyDto,
  AssignAssessorsBodyDto,
  AssignAssessorsDto,
} from './dto';
import { OrganigramVersion } from './entities/organigram-version.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';
// import { Role } from '../users/enums/role.enum';
// import { User } from '../users/entities/user.entity';
import { ParseMongoIdPipe } from '../common/pipes/parse-mongo-id.pipe';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Organigrama (Versiones)')
@Controller('organigram-versions')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('JWT-auth')
export class OrganigramVersionsController {
  constructor(
    private readonly organigramVersionsService: OrganigramVersionsService,
  ) {}

  // @Post()
  // // @Roles(Role.ADMIN, Role.EDITOR)
  // @HttpCode(HttpStatus.CREATED)
  // @ApiOperation({
  //   summary:
  //     'Crear una nueva versión del organigrama a partir de una estructura de árbol JSON.',
  // })
  // @ApiResponse({
  //   status: 201,
  //   description: 'Versión del organigrama creada exitosamente.',
  //   type: OrganigramVersion,
  // })
  // @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  // @ApiBody({ type: CreateOrganigramVersionDto })
  // async createNewVersion(
  //   @Body() createOrganigramVersionDto: CreateOrganigramVersionDto,
  //   @Request() req?: any, // Opcional hasta integrar Keycloak
  // ): Promise<OrganigramVersion> {
  //   return this.organigramVersionsService.processAndCreateVersion(
  //     createOrganigramVersionDto,
  //     req?.user, // Puede ser undefined
  //   );
  // }
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Crear una nueva versión del organigrama con asignaciones de personal',
    description: `
    Crea una nueva versión del organigrama a partir de una estructura JSON.
    
    NOVEDADES:
    - Soporte para archivo de decreto PDF
    - Asignación directa de funcionarios responsables y asesores durante la creación
    - Validación mejorada de departamentos que permite nombres duplicados en diferentes contextos jerárquicos
    
    VALIDACIÓN DE DEPARTAMENTOS:
    1. Busca por nombre + código (si ambos están presentes)
    2. Busca por contexto jerárquico (nombre + nivel + ubicación en la estructura)
    3. Crea nuevo departamento si no existe
    
    ASIGNACIÓN DE PERSONAS:
    - responsible_official_id: debe ser una persona con person_type = 'OFFICIAL'
    - assigned_assessor_ids: array de personas con person_type = 'ASSESSOR'
  `,
  })
  @ApiResponse({
    status: 201,
    description:
      'Versión del organigrama creada exitosamente con asignaciones de personal.',
    type: OrganigramVersion,
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos de entrada inválidos, archivo de decreto no válido, o tipos de persona incorrectos.',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'decree_file_id debe ser un ObjectId válido',
          'La persona con ID xxx no es un funcionario (tipo requerido: OFFICIAL)',
          'Las siguientes personas no son asesores: yyy, zzz',
        ],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Archivo de decreto, funcionario o asesor no encontrado.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Los siguientes asesores no fueron encontrados: xxx, yyy',
        error: 'Not Found',
      },
    },
  })
  @ApiBody({ type: CreateOrganigramVersionDto })
  async createNewVersion(
    @Body() createOrganigramVersionDto: CreateOrganigramVersionDto,
    @Request() req?: any,
  ): Promise<OrganigramVersion> {
    return this.organigramVersionsService.processAndCreateVersion(
      createOrganigramVersionDto,
      req?.user,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las versiones del organigrama',
    description:
      'Devuelve una lista con todas las versiones incluyendo version_tag, effective_date y _id',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de versiones obtenida exitosamente.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          version_tag: {
            type: 'string',
            example: 'v1.2.3',
          },
          effective_date: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
          isActive: {
            type: 'boolean',
            example: true,
          },
        },
      },
    },
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Campo por el cual ordenar (effective_date, version_tag)',
    example: 'effective_date',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Orden de clasificación (asc, desc)',
    example: 'desc',
  })
  async getAllVersions(
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ): Promise<
    Array<{
      _id: string;
      version_tag: string;
      effective_date: Date;
      isActive: boolean;
    }>
  > {
    return this.organigramVersionsService.getAllVersions(sortBy, sortOrder);
  }

  @Get('active/structure')
  // @Roles(Role.ADMIN, Role.EDITOR, Role.VIEWER)
  @ApiOperation({
    summary:
      'Obtener la estructura completa de la versión activa del organigrama',
  })
  @ApiResponse({
    status: 200,
    description: 'Estructura del organigrama activo obtenida exitosamente.',
    type: OrganigramStructureResponseDto,
  })
  @ApiResponse({ status: 404, description: 'No se encontró versión activa.' })
  async getActiveOrganigramStructure(): Promise<OrganigramStructureResponseDto> {
    return this.organigramVersionsService.getActiveOrganigramStructure();
  }

  @Get(':versionId/structure')
  // @Roles(Role.ADMIN, Role.EDITOR, Role.VIEWER)
  @ApiOperation({
    summary:
      'Obtener la estructura completa de una versión específica del organigrama',
  })
  @ApiParam({
    name: 'versionId',
    description: 'ID de la versión del organigrama (ObjectId de MongoDB)',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Estructura del organigrama obtenida exitosamente.',
    type: OrganigramStructureResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Versión no encontrada.' })
  async getOrganigramStructureByVersion(
    @Param('versionId', ParseMongoIdPipe) versionId: string,
  ): Promise<OrganigramStructureResponseDto> {
    return this.organigramVersionsService.getOrganigramStructureByVersion(
      versionId,
    );
  }

  @Get('active')
  // @Roles(Role.ADMIN, Role.EDITOR, Role.VIEWER)
  @ApiOperation({
    summary: 'Obtener información básica de la versión activa del organigrama',
  })
  @ApiResponse({
    status: 200,
    description: 'Versión activa obtenida exitosamente.',
    type: OrganigramVersion,
  })
  @ApiResponse({ status: 404, description: 'No se encontró versión activa.' })
  async getActiveVersion(): Promise<OrganigramVersion> {
    return this.organigramVersionsService.getActiveVersion();
  }

  @Get('node/:nodeId/descendants')
  @ApiOperation({
    summary:
      'Obtener un nodo y todos sus descendientes en una estructura jerárquica.',
    description:
      'Dado el ID de un department_node, devuelve ese nodo con toda su descendencia anidada (hijos, nietos, etc.), incluyendo información de funcionarios responsables y asesores asignados.',
  })
  @ApiParam({
    name: 'nodeId',
    description: 'ID del nodo de departamento (ObjectId de MongoDB)',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({
    status: 200,
    description:
      'Estructura de descendientes obtenida exitosamente con datos de personas.',
    type: OrganigramNodeDto, // Aquí podrías crear un DTO específico si quieres
  })
  @ApiResponse({ status: 404, description: 'Nodo no encontrado.' })
  async getNodeWithDescendants(
    @Param('nodeId', ParseMongoIdPipe) nodeId: string,
  ) {
    return this.organigramVersionsService.getDescendantStructureForNode(nodeId);
  }

  @Get('node/:nodeId/children')
  @ApiOperation({
    summary: 'Obtener solo los hijos directos de un nodo.',
    description:
      'Retorna únicamente los hijos directos del nodo especificado, incluyendo información de funcionarios responsables y asesores.',
  })
  @ApiParam({
    name: 'nodeId',
    description: 'ID del nodo de departamento',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({
    status: 200,
    description: 'Hijos directos obtenidos exitosamente.',
    type: [OrganigramNodeDto],
  })
  async getDirectChildren(@Param('nodeId', ParseMongoIdPipe) nodeId: string) {
    return this.organigramVersionsService.getDirectChildren(nodeId);
  }

  @Get(':versionId/level/:levelId/nodes')
  @ApiOperation({
    summary: 'Obtener todos los nodos de un nivel específico en una versión.',
    description:
      'Retorna todos los departamentos que pertenecen a un nivel jerárquico específico en una versión del organigrama, incluyendo datos de personas asignadas.',
  })
  @ApiParam({ name: 'versionId', description: 'ID de la versión' })
  @ApiParam({ name: 'levelId', description: 'ID del nivel' })
  @ApiResponse({
    status: 200,
    description: 'Nodos del nivel obtenidos exitosamente.',
    type: [OrganigramNodeDto],
  })
  async getNodesByLevel(
    @Param('versionId', ParseMongoIdPipe) versionId: string,
    @Param('levelId', ParseMongoIdPipe) levelId: string,
  ) {
    return this.organigramVersionsService.getNodesByLevel(versionId, levelId);
  }

  @Patch(':versionId/activate')
  // @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Activar una versión específica del organigrama.',
  })
  @ApiParam({ name: 'versionId', description: 'ID de la versión a activar' })
  @ApiResponse({
    status: 200,
    description: 'Versión activada exitosamente.',
    type: OrganigramVersion,
  })
  async activateVersion(
    @Param('versionId', ParseMongoIdPipe) versionId: string,
  ): Promise<OrganigramVersion> {
    return this.organigramVersionsService.activateVersion(versionId);
  }

  @Patch(':versionId/deactivate')
  // @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Desactivar una versión específica del organigrama.',
  })
  @ApiParam({ name: 'versionId', description: 'ID de la versión a desactivar' })
  @ApiResponse({
    status: 200,
    description: 'Versión desactivada exitosamente.',
    type: OrganigramVersion,
  })
  async deactivateVersion(
    @Param('versionId', ParseMongoIdPipe) versionId: string,
  ): Promise<OrganigramVersion> {
    return this.organigramVersionsService.deactivateVersion(versionId);
  }

  @Patch(':versionId/nodes/:nodeId/assign-official')
  @ApiOperation({
    summary: 'Asignar funcionario responsable a un nodo de departamento',
  })
  async assignResponsibleOfficialWithBody(
    @Param('versionId', ParseMongoIdPipe) versionId: string,
    @Param('nodeId', ParseMongoIdPipe) nodeId: string,
    @Body() body: AssignResponsibleOfficialBodyDto,
  ): Promise<OrganigramVersion> {
    const dto: AssignResponsibleOfficialDto = {
      versionId,
      nodeId,
      responsibleId: body.responsibleId,
    };

    return this.organigramVersionsService.assignResponsibleOfficial(dto);
  }

  @Patch(':versionId/nodes/:nodeId/assign-assessors')
  @ApiOperation({
    summary: 'Asignar asesores a un nodo de departamento',
    description:
      'Reemplaza todos los asesores existentes con los nuevos asesores especificados',
  })
  @ApiParam({
    name: 'versionId',
    description: 'ID de la versión del organigrama',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'nodeId',
    description: 'ID del nodo de departamento',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiBody({
    type: AssignAssessorsBodyDto,
    description: 'Lista de IDs de asesores a asignar',
  })
  @ApiResponse({
    status: 200,
    description: 'Asesores asignados exitosamente',
    type: OrganigramVersion,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos o persona no es asesor',
  })
  @ApiResponse({
    status: 404,
    description: 'Versión, nodo o asesor no encontrado',
  })
  async assignAssessorsToNode(
    @Param('versionId', ParseMongoIdPipe) versionId: string,
    @Param('nodeId', ParseMongoIdPipe) nodeId: string,
    @Body() body: AssignAssessorsBodyDto,
  ): Promise<OrganigramVersion> {
    const dto: AssignAssessorsDto = {
      versionId,
      nodeId,
      assessorIds: body.assessorIds,
    };

    return this.organigramVersionsService.assignAssessors(dto);
  }

  @Patch(':versionId/nodes/:nodeId/add-assessors')
  @ApiOperation({
    summary: 'Agregar asesores adicionales a un nodo de departamento',
    description:
      'Agrega nuevos asesores a los ya existentes sin reemplazar. No permite duplicados.',
  })
  @ApiParam({
    name: 'versionId',
    description: 'ID de la versión del organigrama',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'nodeId',
    description: 'ID del nodo de departamento',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiBody({
    type: AssignAssessorsBodyDto,
    description: 'Lista de IDs de asesores a agregar',
  })
  @ApiResponse({
    status: 200,
    description: 'Asesores agregados exitosamente',
    type: OrganigramVersion,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos o persona no es asesor',
  })
  @ApiResponse({
    status: 404,
    description: 'Versión, nodo o asesor no encontrado',
  })
  async addAssessorsToNode(
    @Param('versionId', ParseMongoIdPipe) versionId: string,
    @Param('nodeId', ParseMongoIdPipe) nodeId: string,
    @Body() body: AssignAssessorsBodyDto,
  ): Promise<OrganigramVersion> {
    const dto: AssignAssessorsDto = {
      versionId,
      nodeId,
      assessorIds: body.assessorIds,
    };

    return this.organigramVersionsService.addAssessorsToNode(dto);
  }

  @Delete(':versionId/nodes/:nodeId/remove-assessors')
  @ApiOperation({
    summary: 'Remover asesores específicos de un nodo de departamento',
    description:
      'Remueve asesores específicos del nodo sin afectar otros asesores existentes',
  })
  @ApiParam({
    name: 'versionId',
    description: 'ID de la versión del organigrama',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'nodeId',
    description: 'ID del nodo de departamento',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiBody({
    type: AssignAssessorsBodyDto,
    description: 'Lista de IDs de asesores a remover',
  })
  @ApiResponse({
    status: 200,
    description: 'Asesores removidos exitosamente',
    type: OrganigramVersion,
  })
  @ApiResponse({
    status: 404,
    description: 'Versión o nodo no encontrado',
  })
  async removeAssessorsFromNode(
    @Param('versionId', ParseMongoIdPipe) versionId: string,
    @Param('nodeId', ParseMongoIdPipe) nodeId: string,
    @Body() body: AssignAssessorsBodyDto,
  ): Promise<OrganigramVersion> {
    return this.organigramVersionsService.removeAssessorsFromNode(
      versionId,
      nodeId,
      body.assessorIds,
    );
  }
}
