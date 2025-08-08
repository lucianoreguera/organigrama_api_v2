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
} from '@nestjs/common';
import { OrganigramVersionsService } from './organigrams_version.service';
import {
  CreateOrganigramVersionDto,
  OrganigramStructureResponseDto,
} from './dto';
import { OrganigramVersion } from './entities/organigram-version.entity';
// import {
//   ApiTags,
//   ApiOperation,
//   ApiResponse,
//   ApiBody,
//   ApiBearerAuth,
//   ApiParam,
//   ApiQuery,
// } from '@nestjs/swagger';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';
// import { Role } from '../users/enums/role.enum';
// import { User } from '../users/entities/user.entity';
import { ParseMongoIdPipe } from '../common/pipes/parse-mongo-id.pipe';

// @ApiTags('Organigrama (Versiones)')
@Controller('organigram-versions')
// @ApiBearerAuth('jwt-access-token')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class OrganigramVersionsController {
  constructor(
    private readonly organigramVersionsService: OrganigramVersionsService,
  ) {}

  @Post()
  // @Roles(Role.ADMIN, Role.EDITOR)
  @HttpCode(HttpStatus.CREATED)
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
  async createNewVersion(
    @Body() createOrganigramVersionDto: CreateOrganigramVersionDto,
    @Request() req?: any, // Opcional hasta integrar Keycloak
  ): Promise<OrganigramVersion> {
    return this.organigramVersionsService.processAndCreateVersion(
      createOrganigramVersionDto,
      req?.user, // Puede ser undefined
    );
  }

  @Get('active/structure')
  // @Roles(Role.ADMIN, Role.EDITOR, Role.VIEWER)
  // @ApiOperation({
  //   summary:
  //     'Obtener la estructura completa de la versión activa del organigrama',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Estructura del organigrama activo obtenida exitosamente.',
  //   type: OrganigramStructureResponseDto,
  // })
  // @ApiResponse({ status: 404, description: 'No se encontró versión activa.' })
  async getActiveOrganigramStructure(): Promise<OrganigramStructureResponseDto> {
    return this.organigramVersionsService.getActiveOrganigramStructure();
  }

  @Get(':versionId/structure')
  // @Roles(Role.ADMIN, Role.EDITOR, Role.VIEWER)
  // @ApiOperation({
  //   summary:
  //     'Obtener la estructura completa de una versión específica del organigrama',
  // })
  // @ApiParam({
  //   name: 'versionId',
  //   description: 'ID de la versión del organigrama (ObjectId de MongoDB)',
  //   example: '507f1f77bcf86cd799439011',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Estructura del organigrama obtenida exitosamente.',
  //   type: OrganigramStructureResponseDto,
  // })
  // @ApiResponse({ status: 404, description: 'Versión no encontrada.' })
  async getOrganigramStructureByVersion(
    @Param('versionId', ParseMongoIdPipe) versionId: string,
  ): Promise<OrganigramStructureResponseDto> {
    return this.organigramVersionsService.getOrganigramStructureByVersion(
      versionId,
    );
  }

  @Get('active')
  // @Roles(Role.ADMIN, Role.EDITOR, Role.VIEWER)
  // @ApiOperation({
  //   summary: 'Obtener información básica de la versión activa del organigrama',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Versión activa obtenida exitosamente.',
  //   type: OrganigramVersion,
  // })
  // @ApiResponse({ status: 404, description: 'No se encontró versión activa.' })
  async getActiveVersion(): Promise<OrganigramVersion> {
    return this.organigramVersionsService.getActiveVersion();
  }

  @Get('node/:nodeId/descendants')
  // @Roles(Role.ADMIN, Role.EDITOR, Role.VIEWER)
  // @ApiOperation({
  //   summary:
  //     'Obtener un nodo y todos sus descendientes en una estructura jerárquica.',
  //   description:
  //     'Dado el ID de un department_node, devuelve ese nodo con toda su descendencia anidada (hijos, nietos, etc.).',
  // })
  // @ApiParam({
  //   name: 'nodeId',
  //   description: 'ID del nodo de departamento (ObjectId de MongoDB)',
  //   example: '507f1f77bcf86cd799439012',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Estructura de descendientes obtenida exitosamente.',
  // })
  // @ApiResponse({ status: 404, description: 'Nodo no encontrado.' })
  async getNodeWithDescendants(
    @Param('nodeId', ParseMongoIdPipe) nodeId: string,
  ) {
    return this.organigramVersionsService.getDescendantStructureForNode(nodeId);
  }

  @Get('node/:nodeId/children')
  // @Roles(Role.ADMIN, Role.EDITOR, Role.VIEWER)
  // @ApiOperation({
  //   summary: 'Obtener solo los hijos directos de un nodo.',
  // })
  // @ApiParam({
  //   name: 'nodeId',
  //   description: 'ID del nodo de departamento',
  //   example: '507f1f77bcf86cd799439012',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Hijos directos obtenidos exitosamente.',
  // })
  async getDirectChildren(@Param('nodeId', ParseMongoIdPipe) nodeId: string) {
    return this.organigramVersionsService.getDirectChildren(nodeId);
  }

  @Get(':versionId/level/:levelId/nodes')
  // @Roles(Role.ADMIN, Role.EDITOR, Role.VIEWER)
  // @ApiOperation({
  //   summary: 'Obtener todos los nodos de un nivel específico en una versión.',
  // })
  // @ApiParam({ name: 'versionId', description: 'ID de la versión' })
  // @ApiParam({ name: 'levelId', description: 'ID del nivel' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Nodos del nivel obtenidos exitosamente.',
  // })
  async getNodesByLevel(
    @Param('versionId', ParseMongoIdPipe) versionId: string,
    @Param('levelId', ParseMongoIdPipe) levelId: string,
  ) {
    return this.organigramVersionsService.getNodesByLevel(versionId, levelId);
  }

  @Patch(':versionId/activate')
  // @Roles(Role.ADMIN)
  // @ApiOperation({
  //   summary: 'Activar una versión específica del organigrama.',
  // })
  // @ApiParam({ name: 'versionId', description: 'ID de la versión a activar' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Versión activada exitosamente.',
  //   type: OrganigramVersion,
  // })
  async activateVersion(
    @Param('versionId', ParseMongoIdPipe) versionId: string,
  ): Promise<OrganigramVersion> {
    return this.organigramVersionsService.activateVersion(versionId);
  }

  @Patch(':versionId/deactivate')
  // @Roles(Role.ADMIN)
  // @ApiOperation({
  //   summary: 'Desactivar una versión específica del organigrama.',
  // })
  // @ApiParam({ name: 'versionId', description: 'ID de la versión a desactivar' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Versión desactivada exitosamente.',
  //   type: OrganigramVersion,
  // })
  async deactivateVersion(
    @Param('versionId', ParseMongoIdPipe) versionId: string,
  ): Promise<OrganigramVersion> {
    return this.organigramVersionsService.deactivateVersion(versionId);
  }
}
