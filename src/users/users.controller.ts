// import {
//   Controller,
//   Get,
//   Put,
//   Delete,
//   Body,
//   UseGuards,
//   Query,
//   Param,
//   ParseIntPipe,
//   DefaultValuePipe,
//   BadRequestException,
//   HttpCode,
//   HttpStatus,
// } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';

// import { UsersService } from './users.service';
// import { UpdateUserMetadataDto } from './dto/update-user-metadata.dto';
// import { CurrentUser } from '../auth/decorators/current-user.decorator';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { RequireRoles } from '../auth/decorators/roles.decorator';

// @Controller('users')
// @UseGuards(AuthGuard('jwt'))
// export class UsersController {
//   constructor(private usersService: UsersService) {}

//   /**
//    * Obtener perfil del usuario actual
//    */
//   // @Get('me')
//   // async getMyProfile(@CurrentUser() keycloakUser: any) {
//   //   // Sincronizar usuario con MongoDB
//   //   const user = await this.usersService.findOrCreateFromKeycloak(keycloakUser);

//   //   return {
//   //     keycloak: {
//   //       userId: keycloakUser.userId,
//   //       username: keycloakUser.username,
//   //       email: keycloakUser.email,
//   //       firstName: keycloakUser.firstName,
//   //       lastName: keycloakUser.lastName,
//   //       roles: keycloakUser.roles,
//   //       realmRoles: keycloakUser.realmRoles,
//   //     },
//   //     database: {
//   //       id: user._id,
//   //       metadata: user.metadata,
//   //       preferences: user.preferences,
//   //       department: user.department,
//   //       position: user.position,
//   //       phone: user.phone,
//   //       profilePicture: user.profilePicture,
//   //       lastLogin: user.lastLogin,
//   //       isActive: user.isActive,
//   //       // createdAt: user.createdAt,
//   //       // updatedAt: user.updatedAt,
//   //     },
//   //   };
//   // }

//   /**
//    * Actualizar metadata del usuario actual
//    */
//   // @Put('me')
//   // async updateMyProfile(
//   //   @CurrentUser() keycloakUser: any,
//   //   @Body() updateData: UpdateUserMetadataDto,
//   // ) {
//   //   const updatedUser = await this.usersService.updateUserMetadata(
//   //     keycloakUser.userId,
//   //     updateData,
//   //   );

//   //   return {
//   //     message: 'Perfil actualizado correctamente',
//   //     user: updatedUser,
//   //   };
//   // }

//   /**
//    * Obtener todos los usuarios con filtros (solo admin)
//    */
//   @Get()
//   @UseGuards(RolesGuard)
//   @RequireRoles('admin')
//   async getAllUsers(
//     @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
//     @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
//     @Query('role') role?: string,
//     @Query('department') department?: string,
//     @Query('search') search?: string,
//   ) {
//     if (limit > 100) {
//       throw new BadRequestException(
//         'El límite máximo es 100 usuarios por página',
//       );
//     }

//     return this.usersService.findWithFilters({
//       page,
//       limit,
//       role,
//       department,
//       search,
//     });
//   }

//   /**
//    * Obtener estadísticas de usuarios (solo admin)
//    */
//   // @Get('stats')
//   // @UseGuards(RolesGuard)
//   // @RequireRoles('admin')
//   // async getUserStats() {
//   //   return this.usersService.getUserStats();
//   // }

//   /**
//    * Obtener usuarios inactivos (solo admin)
//    */
//   // @Get('inactive')
//   // @UseGuards(RolesGuard)
//   // @RequireRoles('admin')
//   // async getInactiveUsers(
//   //   @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
//   // ) {
//   //   if (days < 1 || days > 365) {
//   //     throw new BadRequestException('Los días deben estar entre 1 y 365');
//   //   }

//   //   const users = await this.usersService.getInactiveUsers(days);
//   //   return {
//   //     message: `Usuarios inactivos por más de ${days} días`,
//   //     count: users.length,
//   //     users,
//   //   };
//   // }

//   /**
//    * Buscar usuarios por rol (solo admin)
//    */
//   // @Get('by-role/:role')
//   // @UseGuards(RolesGuard)
//   // @RequireRoles('admin')
//   // async getUsersByRole(@Param('role') role: string) {
//   //   const users = await this.usersService.findByRole(role);
//   //   return {
//   //     role,
//   //     count: users.length,
//   //     users,
//   //   };
//   // }

//   /**
//    * Buscar usuarios por departamento (solo admin)
//    */
//   // @Get('by-department/:department')
//   // @UseGuards(RolesGuard)
//   // @RequireRoles('admin')
//   // async getUsersByDepartment(@Param('department') department: string) {
//   //   const users = await this.usersService.findByDepartment(department);
//   //   return {
//   //     department,
//   //     count: users.length,
//   //     users,
//   //   };
//   // }

//   /**
//    * Obtener perfil de un usuario específico por username (solo admin)
//    */
//   // @Get(':username')
//   // @UseGuards(RolesGuard)
//   // @RequireRoles('admin')
//   // async getUserProfile(@Param('username') username: string) {
//   //   const user = await this.usersService.findByUsername(username);
//   //   if (!user) {
//   //     throw new BadRequestException('Usuario no encontrado');
//   //   }
//   //   return user;
//   // }

//   /**
//    * Actualizar metadata de un usuario específico (solo admin)
//    */
//   // @Put(':username')
//   // @UseGuards(RolesGuard)
//   // @RequireRoles('admin')
//   // async updateUserProfile(
//   //   @Param('username') username: string,
//   //   @Body() updateData: UpdateUserMetadataDto,
//   // ) {
//   //   const user = await this.usersService.findByUsername(username);
//   //   if (!user) {
//   //     throw new BadRequestException('Usuario no encontrado');
//   //   }

//   //   const updatedUser = await this.usersService.updateUserMetadata(
//   //     user.keycloakId,
//   //     updateData,
//   //   );

//   //   return {
//   //     message: 'Usuario actualizado correctamente',
//   //     user: updatedUser,
//   //   };
//   // }

//   /**
//    * Desactivar usuario (solo admin)
//    */
//   @Put(':username/deactivate')
//   @UseGuards(RolesGuard)
//   @RequireRoles('admin')
//   @HttpCode(HttpStatus.OK)
//   async deactivateUser(@Param('username') username: string) {
//     const user = await this.usersService.findByUsername(username);
//     if (!user) {
//       throw new BadRequestException('Usuario no encontrado');
//     }

//     const deactivatedUser = await this.usersService.deactivateUser(
//       user.keycloakId,
//     );

//     return {
//       message: 'Usuario desactivado correctamente',
//       user: deactivatedUser,
//     };
//   }

//   /**
//    * Reactivar usuario (solo admin)
//    */
//   @Put(':username/reactivate')
//   @UseGuards(RolesGuard)
//   @RequireRoles('admin')
//   @HttpCode(HttpStatus.OK)
//   async reactivateUser(@Param('username') username: string) {
//     // Buscar usuario incluso si está desactivado
//     const user = await this.usersService.findByUsername(username);
//     if (!user) {
//       throw new BadRequestException('Usuario no encontrado');
//     }

//     const reactivatedUser = await this.usersService.reactivateUser(
//       user.keycloakId,
//     );

//     return {
//       message: 'Usuario reactivado correctamente',
//       user: reactivatedUser,
//     };
//   }

//   /**
//    * Eliminar usuario permanentemente (solo admin) - usar con extrema precaución
//    */
//   // @Delete(':username')
//   // @UseGuards(RolesGuard)
//   // @RequireRoles('admin')
//   // @HttpCode(HttpStatus.OK)
//   // async deleteUser(@Param('username') username: string) {
//   //   const user = await this.usersService.findByUsername(username);
//   //   if (!user) {
//   //     throw new BadRequestException('Usuario no encontrado');
//   //   }

//   //   const deleted = await this.usersService.deleteUser(user.keycloakId);

//   //   if (deleted) {
//   //     return {
//   //       message: 'Usuario eliminado permanentemente',
//   //       username,
//   //     };
//   //   } else {
//   //     throw new BadRequestException('No se pudo eliminar el usuario');
//   //   }
//   // }
// }

// import {
//   Controller,
//   Get,
//   Put,
//   Body,
//   Param,
//   Query,
//   UseGuards,
//   HttpCode,
//   HttpStatus,
// } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
// import {
//   ApiTags,
//   ApiOperation,
//   ApiResponse,
//   ApiBearerAuth,
//   ApiParam,
//   ApiBody,
// } from '@nestjs/swagger';
// import { UsersService } from './users.service';
// import { UpdateUserMetadataDto } from './dto/update-user-metadata.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
// import { CurrentUser } from '../auth/decorators/current-user.decorator';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { RequireRoles } from '../auth/decorators/roles.decorator';

// @ApiTags('Usuarios')
// @Controller('users')
// @UseGuards(AuthGuard('jwt'))
// @ApiBearerAuth('JWT-auth')
// export class UsersController {
//   constructor(private readonly usersService: UsersService) {}

//   /**
//    * Obtener perfil del usuario actual
//    */
//   @Get('me')
//   @ApiOperation({
//     summary: 'Obtener mi perfil',
//     description: 'Devuelve la información completa del usuario autenticado.',
//   })
//   @ApiResponse({
//     status: 200,
//     description: 'Perfil del usuario.',
//   })
//   @ApiResponse({ status: 401, description: 'No autorizado.' })
//   async getMyProfile(@CurrentUser() user: any) {
//     return this.usersService.findByKeycloakId(user.userId);
//   }

//   /**
//    * NUEVO: Actualizar datos del usuario actual
//    */
//   @Put('me')
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({
//     summary: 'Actualizar mis datos',
//     description:
//       'Permite al usuario autenticado actualizar su firstName, lastName, email y DNI.',
//   })
//   @ApiBody({ type: UpdateUserDto })
//   @ApiResponse({
//     status: 200,
//     description: 'Datos actualizados exitosamente.',
//   })
//   @ApiResponse({
//     status: 400,
//     description: 'Datos inválidos o email/DNI ya en uso.',
//   })
//   @ApiResponse({ status: 401, description: 'No autorizado.' })
//   async updateMyProfile(
//     @CurrentUser() user: any,
//     @Body() updateUserDto: UpdateUserDto,
//   ) {
//     return this.usersService.update(user.userId, updateUserDto);
//   }

//   /**
//    * Obtener todos los usuarios (solo admin)
//    */
//   @Get()
//   @UseGuards(RolesGuard)
//   @RequireRoles('admin')
//   @ApiOperation({
//     summary: 'Listar usuarios (admin)',
//     description: 'Devuelve una lista paginada de todos los usuarios.',
//   })
//   @ApiResponse({
//     status: 200,
//     description: 'Lista de usuarios.',
//   })
//   @ApiResponse({ status: 401, description: 'No autorizado.' })
//   @ApiResponse({
//     status: 403,
//     description: 'Permisos insuficientes (requiere rol admin).',
//   })
//   async findAll(
//     @Query('page') page: number = 1,
//     @Query('limit') limit: number = 10,
//   ) {
//     return this.usersService.findAll(page, limit);
//   }

//   /**
//    * NUEVO: Actualizar datos de cualquier usuario (solo admin)
//    */
//   @Put(':keycloakId')
//   @UseGuards(RolesGuard)
//   @RequireRoles('admin')
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({
//     summary: 'Actualizar usuario (admin)',
//     description:
//       'Permite a un admin actualizar los datos de cualquier usuario.',
//   })
//   @ApiParam({
//     name: 'keycloakId',
//     description: 'ID de Keycloak del usuario',
//     example: '6f34313a-7ba4-46fd-8851-03ee6907cec2',
//   })
//   @ApiBody({ type: UpdateUserDto })
//   @ApiResponse({
//     status: 200,
//     description: 'Usuario actualizado exitosamente.',
//   })
//   @ApiResponse({
//     status: 400,
//     description: 'Datos inválidos o email/DNI ya en uso.',
//   })
//   @ApiResponse({ status: 401, description: 'No autorizado.' })
//   @ApiResponse({
//     status: 403,
//     description: 'Permisos insuficientes (requiere rol admin).',
//   })
//   @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
//   async updateUser(
//     @Param('keycloakId') keycloakId: string,
//     @Body() updateUserDto: UpdateUserDto,
//   ) {
//     return this.usersService.update(keycloakId, updateUserDto);
//   }

//   /**
//    * Buscar usuarios por filtros (solo admin)
//    */
//   @Get('search')
//   @UseGuards(RolesGuard)
//   @RequireRoles('admin')
//   @ApiOperation({
//     summary: 'Buscar usuarios (admin)',
//     description: 'Busca usuarios por rol, departamento o término de búsqueda.',
//   })
//   @ApiResponse({
//     status: 200,
//     description: 'Resultados de la búsqueda.',
//   })
//   @ApiResponse({ status: 401, description: 'No autorizado.' })
//   @ApiResponse({
//     status: 403,
//     description: 'Permisos insuficientes (requiere rol admin).',
//   })
//   async searchUsers(
//     @Query('role') role?: string,
//     @Query('department') department?: string,
//     @Query('search') search?: string,
//   ) {
//     return this.usersService.findWithFilters({ role, department, search });
//   }

//   /**
//    * Obtener un usuario específico por Keycloak ID (solo admin)
//    */
//   @Get(':keycloakId')
//   @UseGuards(RolesGuard)
//   @RequireRoles('admin')
//   @ApiOperation({
//     summary: 'Obtener usuario por ID (admin)',
//     description: 'Devuelve la información de un usuario específico.',
//   })
//   @ApiParam({
//     name: 'keycloakId',
//     description: 'ID de Keycloak del usuario',
//   })
//   @ApiResponse({
//     status: 200,
//     description: 'Información del usuario.',
//   })
//   @ApiResponse({ status: 401, description: 'No autorizado.' })
//   @ApiResponse({
//     status: 403,
//     description: 'Permisos insuficientes (requiere rol admin).',
//   })
//   @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
//   async findOne(@Param('keycloakId') keycloakId: string) {
//     const user = await this.usersService.findByKeycloakId(keycloakId);
//     if (!user) {
//       throw new NotFoundException('Usuario no encontrado');
//     }
//     return user;
//   }

//   /**
//    * Actualizar metadata del usuario
//    */
//   @Put(':keycloakId/metadata')
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({
//     summary: 'Actualizar metadata del usuario',
//     description: 'Actualiza la metadata personalizada del usuario.',
//   })
//   @ApiParam({
//     name: 'keycloakId',
//     description: 'ID de Keycloak del usuario',
//   })
//   @ApiBody({ type: UpdateUserMetadataDto })
//   @ApiResponse({
//     status: 200,
//     description: 'Metadata actualizada exitosamente.',
//   })
//   @ApiResponse({ status: 401, description: 'No autorizado.' })
//   @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
//   async updateMetadata(
//     @Param('keycloakId') keycloakId: string,
//     @Body() updateMetadataDto: UpdateUserMetadataDto,
//   ) {
//     return this.usersService.updateMetadata(keycloakId, updateMetadataDto);
//   }

//   /**
//    * Desactivar usuario (solo admin)
//    */
//   @Put(':keycloakId/deactivate')
//   @UseGuards(RolesGuard)
//   @RequireRoles('admin')
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({
//     summary: 'Desactivar usuario (admin)',
//     description: 'Desactiva un usuario del sistema (soft delete).',
//   })
//   @ApiParam({
//     name: 'keycloakId',
//     description: 'ID de Keycloak del usuario',
//   })
//   @ApiResponse({
//     status: 200,
//     description: 'Usuario desactivado exitosamente.',
//   })
//   @ApiResponse({ status: 401, description: 'No autorizado.' })
//   @ApiResponse({
//     status: 403,
//     description: 'Permisos insuficientes (requiere rol admin).',
//   })
//   @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
//   async deactivateUser(@Param('keycloakId') keycloakId: string) {
//     return this.usersService.deactivate(keycloakId);
//   }

//   /**
//    * Reactivar usuario (solo admin)
//    */
//   @Put(':keycloakId/reactivate')
//   @UseGuards(RolesGuard)
//   @RequireRoles('admin')
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({
//     summary: 'Reactivar usuario (admin)',
//     description: 'Reactiva un usuario previamente desactivado.',
//   })
//   @ApiParam({
//     name: 'keycloakId',
//     description: 'ID de Keycloak del usuario',
//   })
//   @ApiResponse({
//     status: 200,
//     description: 'Usuario reactivado exitosamente.',
//   })
//   @ApiResponse({ status: 401, description: 'No autorizado.' })
//   @ApiResponse({
//     status: 403,
//     description: 'Permisos insuficientes (requiere rol admin).',
//   })
//   @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
//   async reactivateUser(@Param('keycloakId') keycloakId: string) {
//     return this.usersService.reactivate(keycloakId);
//   }
// }

// import { NotFoundException } from '@nestjs/common';

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
