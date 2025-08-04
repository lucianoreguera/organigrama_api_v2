import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';
import { UpdateUserMetadataDto } from './dto/update-user-metadata.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  /**
   * Busca o crea un usuario basado en información de Keycloak
   */
  async findOrCreateFromKeycloak(keycloakUser: any): Promise<User> {
    let user = await this.userModel.findOne({
      keycloakId: keycloakUser.userId,
    });

    if (!user) {
      console.log(`🆕 Creando nuevo usuario: ${keycloakUser.username}`);
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
      // Actualizar información que puede haber cambiado en Keycloak
      console.log(
        `🔄 Actualizando usuario existente: ${keycloakUser.username}`,
      );
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
   * Obtener todos los usuarios (solo admin)
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    users: User[];
    total: number;
    page: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.userModel
        .find({ isActive: true })
        .sort({ lastLogin: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments({ isActive: true }),
    ]);

    return {
      users,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Buscar usuarios con filtros
   */
  async findWithFilters(filters: {
    role?: string;
    department?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    users: User[];
    total: number;
    page: number;
    pages: number;
  }> {
    const { role, department, search, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    // Construir query
    const query: any = { isActive: true };

    if (role) {
      query.roles = role;
    }

    if (department) {
      query.department = department;
    }

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .sort({ lastLogin: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(query),
    ]);

    return {
      users,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Actualizar metadata del usuario
   */
  async updateUserMetadata(
    keycloakId: string,
    updateData: UpdateUserMetadataDto,
  ): Promise<User> {
    const user = await this.userModel.findOneAndUpdate(
      { keycloakId, isActive: true },
      { $set: updateData },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  /**
   * Actualizar información específica del usuario
   */
  async updateUser(
    keycloakId: string,
    updateData: Partial<User>,
  ): Promise<User> {
    const user = await this.userModel.findOneAndUpdate(
      { keycloakId, isActive: true },
      { $set: updateData },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  /**
   * Desactivar usuario (soft delete)
   */
  async deactivateUser(keycloakId: string): Promise<User> {
    const user = await this.userModel.findOneAndUpdate(
      { keycloakId },
      { $set: { isActive: false } },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  /**
   * Reactivar usuario
   */
  async reactivateUser(keycloakId: string): Promise<User> {
    const user = await this.userModel.findOneAndUpdate(
      { keycloakId },
      { $set: { isActive: true } },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  /**
   * Buscar usuarios por rol
   */
  async findByRole(role: string): Promise<User[]> {
    return this.userModel.find({
      roles: role,
      isActive: true,
    });
  }

  /**
   * Buscar usuarios por departamento
   */
  async findByDepartment(department: string): Promise<User[]> {
    return this.userModel.find({
      department,
      isActive: true,
    });
  }

  /**
   * Estadísticas de usuarios
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
    byDepartment: Record<string, number>;
    recentLogins: number;
  }> {
    const [total, active, inactive, roleAggregation, departmentAggregation] =
      await Promise.all([
        this.userModel.countDocuments(),
        this.userModel.countDocuments({ isActive: true }),
        this.userModel.countDocuments({ isActive: false }),
        this.userModel.aggregate([
          { $match: { isActive: true } },
          { $unwind: '$roles' },
          { $group: { _id: '$roles', count: { $sum: 1 } } },
        ]),
        this.userModel.aggregate([
          {
            $match: {
              isActive: true,
              department: { $exists: true, $ne: null },
            },
          },
          { $group: { _id: '$department', count: { $sum: 1 } } },
        ]),
      ]);

    // Usuarios que se logearon en los últimos 7 días
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const recentLogins = await this.userModel.countDocuments({
      isActive: true,
      lastLogin: { $gte: lastWeek },
    });

    const byRole = roleAggregation.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const byDepartment = departmentAggregation.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    return { total, active, inactive, byRole, byDepartment, recentLogins };
  }

  /**
   * Obtener usuarios inactivos (que no se han logeado recientemente)
   */
  async getInactiveUsers(days: number = 30): Promise<User[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.userModel.find({
      isActive: true,
      $or: [
        { lastLogin: { $lt: cutoffDate } },
        { lastLogin: { $exists: false } },
      ],
    });
  }

  /**
   * Eliminar usuario permanentemente (usar con precaución)
   */
  async deleteUser(keycloakId: string): Promise<boolean> {
    const result = await this.userModel.deleteOne({ keycloakId });
    return result.deletedCount > 0;
  }
}
