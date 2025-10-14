import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserMetadataDto } from './dto/update-user-metadata.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequireRoles } from '../auth/decorators/roles.decorator';
import { QueryUserDto } from './dto/query-user.dto';

@ApiTags('Usuarios')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Obtener perfil del usuario actual
   */
  // @Get('me')
  // @ApiOperation({
  //   summary: 'Obtener mi perfil',
  //   description: 'Devuelve la información completa del usuario autenticado.',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Perfil del usuario.',
  // })
  // @ApiResponse({ status: 401, description: 'No autorizado.' })
  // async getMyProfile(@CurrentUser() user: any) {
  //   return this.usersService.findByKeycloakId(user.userId);
  // }

  /**
   * NUEVO: Actualizar datos del usuario actual
   */
  @Put('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar datos usuario logueado',
    description:
      'Permite al usuario autenticado actualizar su firstName, lastName, email y DNI.',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'Datos actualizados exitosamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o email/DNI ya en uso.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  async updateMyProfile(
    @CurrentUser() user: any,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(user.userId, updateUserDto);
  }

  /**
   * Obtener todos los usuarios (solo admin)
   */
  @Get()
  @UseGuards(RolesGuard)
  @RequireRoles('admin')
  @ApiOperation({
    summary: 'Listar usuarios (admin)',
    description: 'Devuelve una lista paginada de todos los usuarios.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes (requiere rol admin).',
  })
  async findAll(@Query() queryUsertDto: QueryUserDto) {
    return this.usersService.findAll(queryUsertDto);
  }

  /**
   * NUEVO: Actualizar datos de cualquier usuario (solo admin)
   */
  @Put(':keycloakId')
  @UseGuards(RolesGuard)
  @RequireRoles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar usuario (admin)',
    description:
      'Permite a un admin actualizar los datos de cualquier usuario.',
  })
  @ApiParam({
    name: 'keycloakId',
    description: 'ID de Keycloak del usuario',
    example: '6f34313a-7ba4-46fd-8851-03ee6907cec2',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado exitosamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o email/DNI ya en uso.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes (requiere rol admin).',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async updateUser(
    @Param('keycloakId') keycloakId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(keycloakId, updateUserDto);
  }

  /**
   * Buscar usuarios por filtros (solo admin)
   */
  // @Get('search')
  // @UseGuards(RolesGuard)
  // @RequireRoles('admin')
  // @ApiOperation({
  //   summary: 'Buscar usuarios (admin)',
  //   description: 'Busca usuarios por rol, departamento o término de búsqueda.',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Resultados de la búsqueda.',
  // })
  // @ApiResponse({ status: 401, description: 'No autorizado.' })
  // @ApiResponse({
  //   status: 403,
  //   description: 'Permisos insuficientes (requiere rol admin).',
  // })
  // async searchUsers(
  //   @Query('role') role?: string,
  //   @Query('department') department?: string,
  //   @Query('search') search?: string,
  // ) {
  //   return this.usersService.findWithFilters({ role, department, search });
  // }

  /**
   * Obtener un usuario específico por Keycloak ID (solo admin)
   */
  // @Get(':keycloakId')
  // @UseGuards(RolesGuard)
  // @RequireRoles('admin')
  // @ApiOperation({
  //   summary: 'Obtener usuario por ID (admin)',
  //   description: 'Devuelve la información de un usuario específico.',
  // })
  // @ApiParam({
  //   name: 'keycloakId',
  //   description: 'ID de Keycloak del usuario',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Información del usuario.',
  // })
  // @ApiResponse({ status: 401, description: 'No autorizado.' })
  // @ApiResponse({
  //   status: 403,
  //   description: 'Permisos insuficientes (requiere rol admin).',
  // })
  // @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  // async findOne(@Param('keycloakId') keycloakId: string) {
  //   const user = await this.usersService.findByKeycloakId(keycloakId);
  //   if (!user) {
  //     throw new NotFoundException('Usuario no encontrado');
  //   }
  //   return user;
  // }

  /**
   * Actualizar metadata del usuario
   */
  // @Put(':keycloakId/metadata')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({
  //   summary: 'Actualizar metadata del usuario',
  //   description: 'Actualiza la metadata personalizada del usuario.',
  // })
  // @ApiParam({
  //   name: 'keycloakId',
  //   description: 'ID de Keycloak del usuario',
  // })
  // @ApiBody({ type: UpdateUserMetadataDto })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Metadata actualizada exitosamente.',
  // })
  // @ApiResponse({ status: 401, description: 'No autorizado.' })
  // @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  // async updateMetadata(
  //   @Param('keycloakId') keycloakId: string,
  //   @Body() updateMetadataDto: UpdateUserMetadataDto,
  // ) {
  //   return this.usersService.updateMetadata(keycloakId, updateMetadataDto);
  // }

  /**
   * Desactivar usuario (solo admin)
   */
  @Put(':keycloakId/deactivate')
  @UseGuards(RolesGuard)
  @RequireRoles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Desactivar usuario (admin)',
    description: 'Desactiva un usuario del sistema (soft delete).',
  })
  @ApiParam({
    name: 'keycloakId',
    description: 'ID de Keycloak del usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario desactivado exitosamente.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes (requiere rol admin).',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async deactivateUser(@Param('keycloakId') keycloakId: string) {
    return this.usersService.deactivate(keycloakId);
  }

  /**
   * Reactivar usuario (solo admin)
   */
  @Put(':keycloakId/reactivate')
  @UseGuards(RolesGuard)
  @RequireRoles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reactivar usuario (admin)',
    description: 'Reactiva un usuario previamente desactivado.',
  })
  @ApiParam({
    name: 'keycloakId',
    description: 'ID de Keycloak del usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario reactivado exitosamente.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes (requiere rol admin).',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async reactivateUser(@Param('keycloakId') keycloakId: string) {
    return this.usersService.reactivate(keycloakId);
  }
}
