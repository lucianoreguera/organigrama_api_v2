import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';
import { UpdateUserMetadataDto } from './dto/update-user-metadata.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { PaginationService } from '../common/services/pagination.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly paginationService: PaginationService,
  ) {}

  /**
   * Busca o crea un usuario basado en información de Keycloak
   */
  async findOrCreateFromKeycloak(keycloakUser: any): Promise<User> {
    let user = await this.userModel.findOne({
      keycloakId: keycloakUser.userId,
    });

    if (!user) {
      user = new this.userModel({
        keycloakId: keycloakUser.userId,
        username: keycloakUser.username,
        email: keycloakUser.email,
        firstName: keycloakUser.firstName,
        lastName: keycloakUser.lastName,
        roles: keycloakUser.roles || [],
        realmRoles: keycloakUser.realmRoles || [],
        lastLogin: new Date(),
      });
      await user.save();
    } else {
      user.roles = keycloakUser.roles || [];
      user.realmRoles = keycloakUser.realmRoles || [];
      user.firstName = keycloakUser.firstName;
      user.lastName = keycloakUser.lastName;
      user.email = keycloakUser.email;
      user.lastLogin = new Date();
      await user.save();
    }

    return user;
  }

  /**
   * Crear usuario manualmente
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = new this.userModel(createUserDto);
    return user.save();
  }

  /**
   * NUEVO: Actualizar datos del usuario
   */
  async update(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Verificar si el usuario existe
    const user = await this.userModel.findOne({
      keycloakId: userId,
      isActive: true,
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Si se está actualizando el email, verificar que no esté en uso
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailExists = await this.userModel.findOne({
        email: updateUserDto.email,
        keycloakId: { $ne: userId },
        isActive: true,
      });

      if (emailExists) {
        throw new BadRequestException(
          'El email ya está en uso por otro usuario',
        );
      }
    }

    // Si se está actualizando el DNI, verificar que no esté en uso
    if (updateUserDto.dni && updateUserDto.dni !== user.dni) {
      const dniExists = await this.userModel.findOne({
        dni: updateUserDto.dni,
        keycloakId: { $ne: userId },
        isActive: true,
      });

      if (dniExists) {
        throw new BadRequestException('El DNI ya está en uso por otro usuario');
      }
    }

    // Actualizar los campos proporcionados
    if (updateUserDto.firstName !== undefined) {
      user.firstName = updateUserDto.firstName;
    }
    if (updateUserDto.lastName !== undefined) {
      user.lastName = updateUserDto.lastName;
    }
    if (updateUserDto.email !== undefined) {
      user.email = updateUserDto.email;
    }
    if (updateUserDto.dni !== undefined) {
      user.dni = updateUserDto.dni;
    }

    return user.save();
  }

  /**
   * Buscar usuario por ID de Keycloak
   */
  async findByKeycloakId(keycloakId: string): Promise<User | null> {
    return this.userModel.findOne({ keycloakId, isActive: true });
  }

  /**
   * Buscar usuario por username
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username, isActive: true });
  }

  /**
   * Buscar usuario por email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email, isActive: true });
  }

  /**
   * NUEVO: Buscar usuario por DNI
   */
  async findByDni(dni: string): Promise<User | null> {
    return this.userModel.findOne({ dni, isActive: true });
  }

  /**
   * Obtener todos los usuarios con paginación (solo admin)
   */
  findAll(queryUserDto: QueryUserDto) {
    const baseFilters: any = { isActive: true };

    // Filtros específicos
    if (queryUserDto.role) {
      baseFilters.roles = queryUserDto.role;
    }

    if (queryUserDto.department) {
      baseFilters.department = queryUserDto.department;
    }

    const paginationOptions = {
      searchFields: ['username', 'email', 'firstName', 'lastName', 'dni'],
      defaultSort: '-lastLogin',
      selectFields: '-__v',
    };

    return this.paginationService.paginate(
      this.userModel,
      queryUserDto,
      baseFilters,
      paginationOptions,
    );
  }

  /**
   * Buscar usuarios con filtros adicionales (DEPRECADO - usar findAll)
   */
  async findWithFilters(filters: {
    role?: string;
    department?: string;
    search?: string;
  }): Promise<User[]> {
    const query: any = { isActive: true };

    if (filters.role) {
      query.roles = filters.role;
    }

    if (filters.department) {
      query.department = filters.department;
    }

    if (filters.search) {
      query.$or = [
        { username: new RegExp(filters.search, 'i') },
        { email: new RegExp(filters.search, 'i') },
        { firstName: new RegExp(filters.search, 'i') },
        { lastName: new RegExp(filters.search, 'i') },
        { dni: new RegExp(filters.search, 'i') },
      ];
    }

    return this.userModel.find(query).exec();
  }

  /**
   * Actualizar metadata del usuario
   */
  async updateMetadata(
    keycloakId: string,
    metadataDto: UpdateUserMetadataDto,
  ): Promise<User> {
    const user = await this.userModel.findOne({ keycloakId, isActive: true });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.metadata = { ...user.metadata, ...metadataDto.metadata };
    return user.save();
  }

  /**
   * Desactivar usuario (soft delete)
   */
  async deactivate(keycloakId: string): Promise<User> {
    const user = await this.userModel.findOne({ keycloakId });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.isActive = false;
    return user.save();
  }

  /**
   * Reactivar usuario
   */
  async reactivate(keycloakId: string): Promise<User> {
    const user = await this.userModel.findOne({ keycloakId });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.isActive = true;
    return user.save();
  }
}
