import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  Query,
  Param,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { UsersService } from './users.service';
import { UpdateUserMetadataDto } from './dto/update-user-metadata.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequireRoles } from '../auth/decorators/roles.decorator';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private usersService: UsersService) {}

  /**
   * Obtener perfil del usuario actual
   */
  @Get('me')
  async getMyProfile(@CurrentUser() keycloakUser: any) {
    // Sincronizar usuario con MongoDB
    const user = await this.usersService.findOrCreateFromKeycloak(keycloakUser);

    return {
      keycloak: {
        userId: keycloakUser.userId,
        username: keycloakUser.username,
        email: keycloakUser.email,
        firstName: keycloakUser.firstName,
        lastName: keycloakUser.lastName,
        roles: keycloakUser.roles,
        realmRoles: keycloakUser.realmRoles,
      },
      database: {
        id: user._id,
        metadata: user.metadata,
        preferences: user.preferences,
        department: user.department,
        position: user.position,
        phone: user.phone,
        profilePicture: user.profilePicture,
        lastLogin: user.lastLogin,
        isActive: user.isActive,
        // createdAt: user.createdAt,
        // updatedAt: user.updatedAt,
      },
    };
  }

  /**
   * Actualizar metadata del usuario actual
   */
  @Put('me')
  async updateMyProfile(
    @CurrentUser() keycloakUser: any,
    @Body() updateData: UpdateUserMetadataDto,
  ) {
    const updatedUser = await this.usersService.updateUserMetadata(
      keycloakUser.userId,
      updateData,
    );

    return {
      message: 'Perfil actualizado correctamente',
      user: updatedUser,
    };
  }

  /**
   * Obtener todos los usuarios con filtros (solo admin)
   */
  @Get()
  @UseGuards(RolesGuard)
  @RequireRoles('admin')
  async getAllUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('role') role?: string,
    @Query('department') department?: string,
    @Query('search') search?: string,
  ) {
    if (limit > 100) {
      throw new BadRequestException(
        'El límite máximo es 100 usuarios por página',
      );
    }

    return this.usersService.findWithFilters({
      page,
      limit,
      role,
      department,
      search,
    });
  }

  /**
   * Obtener estadísticas de usuarios (solo admin)
   */
  @Get('stats')
  @UseGuards(RolesGuard)
  @RequireRoles('admin')
  async getUserStats() {
    return this.usersService.getUserStats();
  }

  /**
   * Obtener usuarios inactivos (solo admin)
   */
  @Get('inactive')
  @UseGuards(RolesGuard)
  @RequireRoles('admin')
  async getInactiveUsers(
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    if (days < 1 || days > 365) {
      throw new BadRequestException('Los días deben estar entre 1 y 365');
    }

    const users = await this.usersService.getInactiveUsers(days);
    return {
      message: `Usuarios inactivos por más de ${days} días`,
      count: users.length,
      users,
    };
  }

  /**
   * Buscar usuarios por rol (solo admin)
   */
  @Get('by-role/:role')
  @UseGuards(RolesGuard)
  @RequireRoles('admin')
  async getUsersByRole(@Param('role') role: string) {
    const users = await this.usersService.findByRole(role);
    return {
      role,
      count: users.length,
      users,
    };
  }

  /**
   * Buscar usuarios por departamento (solo admin)
   */
  @Get('by-department/:department')
  @UseGuards(RolesGuard)
  @RequireRoles('admin')
  async getUsersByDepartment(@Param('department') department: string) {
    const users = await this.usersService.findByDepartment(department);
    return {
      department,
      count: users.length,
      users,
    };
  }

  /**
   * Obtener perfil de un usuario específico por username (solo admin)
   */
  @Get(':username')
  @UseGuards(RolesGuard)
  @RequireRoles('admin')
  async getUserProfile(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }
    return user;
  }

  /**
   * Actualizar metadata de un usuario específico (solo admin)
   */
  @Put(':username')
  @UseGuards(RolesGuard)
  @RequireRoles('admin')
  async updateUserProfile(
    @Param('username') username: string,
    @Body() updateData: UpdateUserMetadataDto,
  ) {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    const updatedUser = await this.usersService.updateUserMetadata(
      user.keycloakId,
      updateData,
    );

    return {
      message: 'Usuario actualizado correctamente',
      user: updatedUser,
    };
  }

  /**
   * Desactivar usuario (solo admin)
   */
  @Put(':username/deactivate')
  @UseGuards(RolesGuard)
  @RequireRoles('admin')
  @HttpCode(HttpStatus.OK)
  async deactivateUser(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    const deactivatedUser = await this.usersService.deactivateUser(
      user.keycloakId,
    );

    return {
      message: 'Usuario desactivado correctamente',
      user: deactivatedUser,
    };
  }

  /**
   * Reactivar usuario (solo admin)
   */
  @Put(':username/reactivate')
  @UseGuards(RolesGuard)
  @RequireRoles('admin')
  @HttpCode(HttpStatus.OK)
  async reactivateUser(@Param('username') username: string) {
    // Buscar usuario incluso si está desactivado
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    const reactivatedUser = await this.usersService.reactivateUser(
      user.keycloakId,
    );

    return {
      message: 'Usuario reactivado correctamente',
      user: reactivatedUser,
    };
  }

  /**
   * Eliminar usuario permanentemente (solo admin) - usar con extrema precaución
   */
  @Delete(':username')
  @UseGuards(RolesGuard)
  @RequireRoles('admin')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    const deleted = await this.usersService.deleteUser(user.keycloakId);

    if (deleted) {
      return {
        message: 'Usuario eliminado permanentemente',
        username,
      };
    } else {
      throw new BadRequestException('No se pudo eliminar el usuario');
    }
  }
}
