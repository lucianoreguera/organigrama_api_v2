// import {
//   Injectable,
//   BadRequestException,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import axios from 'axios';
// import {
//   KeycloakAdminService,
//   CreateKeycloakUserDto,
// } from './keycloak-admin.service';
// import { RegisterDto } from './dto/register.dto';
// import { UsersService } from '../users/users.service';
// import { ChangePasswordDto } from './dto/change-password.dto';
// import { ResetPasswordByAdminDto } from './dto/reset-password-by-admin.dto';

// export interface KeycloakTokenResponse {
//   access_token: string;
//   expires_in: number;
//   refresh_expires_in: number;
//   refresh_token: string;
//   token_type: string;
//   id_token: string;
//   scope: string;
// }

// export interface LoginDto {
//   username: string;
//   password: string;
// }

// @Injectable()
// export class AuthService {
//   private readonly keycloakUrl: string;
//   private readonly realm: string;
//   private readonly clientId: string;
//   private readonly clientSecret: string;

//   constructor(
//     private configService: ConfigService,
//     private keycloakAdminService: KeycloakAdminService,
//     private usersService: UsersService,
//   ) {
//     this.keycloakUrl = this.configService.get('KEYCLOAK_BASE_URL')!;
//     this.realm = this.configService.get('KEYCLOAK_REALM')!;
//     this.clientId = this.configService.get('KEYCLOAK_CLIENT_ID')!;
//     this.clientSecret = this.configService.get('KEYCLOAK_CLIENT_SECRET')!;
//   }

//   // ============================================
//   // LOGIN - MANTENER COMO ESTABA (FUNCIONANDO)
//   // ============================================
//   async login(loginDto: LoginDto): Promise<KeycloakTokenResponse> {
//     const url = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;

//     const params = new URLSearchParams();
//     params.append('grant_type', 'password');
//     params.append('client_id', this.clientId);
//     params.append('client_secret', this.clientSecret);
//     params.append('username', loginDto.username);
//     params.append('password', loginDto.password);

//     try {
//       const response = await axios.post(url, params, {
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded',
//         },
//       });

//       return response.data;
//     } catch (error) {
//       throw new Error('Invalid credentials');
//     }
//   }

//   // ============================================
//   // REFRESH TOKEN - MANTENER COMO ESTABA
//   // ============================================
//   async refreshToken(refreshToken: string): Promise<KeycloakTokenResponse> {
//     const url = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;

//     const params = new URLSearchParams();
//     params.append('grant_type', 'refresh_token');
//     params.append('client_id', this.clientId);
//     params.append('client_secret', this.clientSecret);
//     params.append('refresh_token', refreshToken);

//     try {
//       const response = await axios.post(url, params, {
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded',
//         },
//       });

//       return response.data;
//     } catch (error) {
//       throw new Error('Invalid refresh token');
//     }
//   }

//   // ============================================
//   // LOGOUT - MANTENER COMO ESTABA
//   // ============================================
//   async logout(refreshToken: string): Promise<void> {
//     const url = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/logout`;

//     const params = new URLSearchParams();
//     params.append('client_id', this.clientId);
//     params.append('client_secret', this.clientSecret);
//     params.append('refresh_token', refreshToken);

//     await axios.post(url, params, {
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//       },
//     });
//   }

//   // ============================================
//   // GET USER INFO - MANTENER COMO ESTABA
//   // ============================================
//   async getUserInfo(accessToken: string): Promise<any> {
//     const url = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/userinfo`;

//     try {
//       const response = await axios.get(url, {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//         },
//       });

//       return response.data;
//     } catch (error) {
//       throw new Error('Invalid access token');
//     }
//   }

//   // ============================================
//   // REGISTER - NUEVO (con sincronización MongoDB)
//   // ============================================
//   async register(registerDto: RegisterDto): Promise<{
//     message: string;
//     username: string;
//     userId: string;
//   }> {
//     try {
//       // 1. Crear usuario en Keycloak
//       const keycloakUser = await this.keycloakAdminService.createUser({
//         username: registerDto.username,
//         password: registerDto.password,
//         email: registerDto.email,
//         firstName: registerDto.firstName,
//         lastName: registerDto.lastName,
//         temporary: false,
//       });

//       // 2. Crear usuario en MongoDB inmediatamente
//       try {
//         await this.usersService.create({
//           keycloakId: keycloakUser.id,
//           username: registerDto.username,
//           email: registerDto.email || '',
//           firstName: registerDto.firstName,
//           lastName: registerDto.lastName,
//           roles: ['user'],
//           realmRoles: ['offline_access', 'uma_authorization'],
//         });
//       } catch (mongoError) {
//         // Si falla MongoDB, hacer rollback en Keycloak
//         await this.keycloakAdminService.deleteUser(keycloakUser.id);
//         throw new BadRequestException(
//           'Error al crear usuario en la base de datos',
//         );
//       }

//       return {
//         message: 'Usuario registrado exitosamente',
//         username: keycloakUser.username,
//         userId: keycloakUser.id,
//       };
//     } catch (error) {
//       if (error instanceof BadRequestException) {
//         throw error;
//       }
//       throw new BadRequestException('Error al registrar usuario');
//     }
//   }

//   // ============================================
//   // CHANGE PASSWORD - Usuario cambia su propia contraseña
//   // ============================================
//   async changePassword(
//     userId: string,
//     username: string,
//     changePasswordDto: ChangePasswordDto,
//   ): Promise<{ message: string }> {
//     try {
//       // 1. Verificar contraseña actual intentando hacer login
//       try {
//         await this.login({
//           username: username,
//           password: changePasswordDto.currentPassword,
//         });
//       } catch (loginError) {
//         throw new BadRequestException('Contraseña actual incorrecta');
//       }

//       // 2. Si el login es correcto, cambiar la contraseña usando Admin API
//       await this.keycloakAdminService.resetPassword(
//         userId,
//         changePasswordDto.newPassword,
//         false, // NO temporal
//       );

//       return {
//         message:
//           'Contraseña actualizada exitosamente. Por favor, inicia sesión nuevamente con tu nueva contraseña.',
//       };
//     } catch (error) {
//       if (error instanceof BadRequestException) {
//         throw error;
//       }
//       throw new BadRequestException('Error al cambiar la contraseña');
//     }
//   }

//   // ============================================
//   // RESET PASSWORD BY ADMIN - Admin resetea contraseña (genera temporal)
//   // ============================================
//   async resetPasswordByAdmin(
//     resetDto: ResetPasswordByAdminDto,
//   ): Promise<{ message: string; temporaryPassword: string }> {
//     try {
//       // Buscar usuario por username en MongoDB para obtener keycloakId
//       const user = await this.usersService.findByUsername(resetDto.username);

//       if (!user) {
//         throw new BadRequestException('Usuario no encontrado');
//       }

//       // Generar contraseña temporal
//       const temporaryPassword = this.generateTemporaryPassword();

//       // Resetear contraseña en Keycloak como NO temporal
//       // Cambiamos a false para que pueda hacer login inmediatamente
//       await this.keycloakAdminService.resetPassword(
//         user.keycloakId,
//         temporaryPassword,
//         false, // NO temporal - el usuario puede hacer login inmediatamente
//       );

//       return {
//         message:
//           'Contraseña reseteada exitosamente. El usuario puede iniciar sesión con la contraseña proporcionada y cambiarla después desde su perfil.',
//         temporaryPassword,
//       };
//     } catch (error) {
//       if (error instanceof BadRequestException) {
//         throw error;
//       }
//       throw new BadRequestException('Error al resetear la contraseña');
//     }
//   }

//   // ============================================
//   // Método auxiliar para generar contraseña temporal
//   // ============================================
//   private generateTemporaryPassword(): string {
//     const length = 12;
//     const charset =
//       'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&';
//     let password = '';

//     // Asegurar que tenga al menos: 1 mayúscula, 1 minúscula, 1 número, 1 especial
//     password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
//     password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
//     password += '0123456789'[Math.floor(Math.random() * 10)];
//     password += '@$!%*?&'[Math.floor(Math.random() * 7)];

//     // Completar el resto
//     for (let i = password.length; i < length; i++) {
//       password += charset[Math.floor(Math.random() * charset.length)];
//     }

//     // Mezclar caracteres
//     return password
//       .split('')
//       .sort(() => Math.random() - 0.5)
//       .join('');
//   }
// }

import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  KeycloakAdminService,
  CreateKeycloakUserDto,
} from './keycloak-admin.service';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordByAdminDto } from './dto/reset-password-by-admin.dto';

export interface KeycloakTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  id_token: string;
  scope: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

@Injectable()
export class AuthService {
  private readonly keycloakUrl: string;
  private readonly realm: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(
    private configService: ConfigService,
    private keycloakAdminService: KeycloakAdminService,
    private usersService: UsersService,
  ) {
    this.keycloakUrl = this.configService.get('KEYCLOAK_BASE_URL')!;
    this.realm = this.configService.get('KEYCLOAK_REALM')!;
    this.clientId = this.configService.get('KEYCLOAK_CLIENT_ID')!;
    this.clientSecret = this.configService.get('KEYCLOAK_CLIENT_SECRET')!;
  }

  // ============================================
  // LOGIN - MANTENER COMO ESTABA (FUNCIONANDO)
  // ============================================
  async login(loginDto: LoginDto): Promise<KeycloakTokenResponse> {
    const url = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;

    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);
    params.append('username', loginDto.username);
    params.append('password', loginDto.password);

    try {
      const response = await axios.post(url, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error('Invalid credentials');
    }
  }

  // ============================================
  // REFRESH TOKEN - MANTENER COMO ESTABA
  // ============================================
  async refreshToken(refreshToken: string): Promise<KeycloakTokenResponse> {
    const url = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;

    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);
    params.append('refresh_token', refreshToken);

    try {
      const response = await axios.post(url, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // ============================================
  // LOGOUT - MANTENER COMO ESTABA
  // ============================================
  async logout(refreshToken: string): Promise<void> {
    const url = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/logout`;

    const params = new URLSearchParams();
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);
    params.append('refresh_token', refreshToken);

    await axios.post(url, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  // ============================================
  // GET USER INFO - MANTENER COMO ESTABA
  // ============================================
  async getUserInfo(accessToken: string): Promise<any> {
    const url = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/userinfo`;

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  // ============================================
  // REGISTER - NUEVO (con sincronización MongoDB)
  // ============================================
  async register(registerDto: RegisterDto): Promise<{
    message: string;
    username: string;
    userId: string;
  }> {
    try {
      // 1. Crear usuario en Keycloak
      const keycloakUser = await this.keycloakAdminService.createUser({
        username: registerDto.username,
        password: registerDto.password,
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        temporary: false,
      });

      // 2. Crear usuario en MongoDB inmediatamente (incluyendo DNI)
      try {
        await this.usersService.create({
          keycloakId: keycloakUser.id,
          username: registerDto.username,
          email: registerDto.email || '',
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          dni: registerDto.dni, // NUEVO: incluir DNI
          roles: ['user'],
          realmRoles: ['offline_access', 'uma_authorization'],
        });
      } catch (mongoError) {
        // Si falla MongoDB, hacer rollback en Keycloak
        await this.keycloakAdminService.deleteUser(keycloakUser.id);
        throw new BadRequestException(
          'Error al crear usuario en la base de datos',
        );
      }

      return {
        message: 'Usuario registrado exitosamente',
        username: keycloakUser.username,
        userId: keycloakUser.id,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al registrar usuario');
    }
  }

  // ============================================
  // CHANGE PASSWORD - Usuario cambia su propia contraseña
  // ============================================
  async changePassword(
    userId: string,
    username: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    try {
      // 1. Verificar contraseña actual intentando hacer login
      try {
        await this.login({
          username: username,
          password: changePasswordDto.currentPassword,
        });
      } catch (loginError) {
        throw new BadRequestException('Contraseña actual incorrecta');
      }

      // 2. Si el login es correcto, cambiar la contraseña usando Admin API
      await this.keycloakAdminService.resetPassword(
        userId,
        changePasswordDto.newPassword,
        false, // NO temporal
      );

      return {
        message:
          'Contraseña actualizada exitosamente. Por favor, inicia sesión nuevamente con tu nueva contraseña.',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al cambiar la contraseña');
    }
  }

  // ============================================
  // RESET PASSWORD BY ADMIN - Admin resetea contraseña (genera temporal)
  // ============================================
  async resetPasswordByAdmin(
    resetDto: ResetPasswordByAdminDto,
  ): Promise<{ message: string; temporaryPassword: string }> {
    try {
      // Buscar usuario por username en MongoDB para obtener keycloakId
      const user = await this.usersService.findByUsername(resetDto.username);

      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }

      // Generar contraseña temporal
      const temporaryPassword = this.generateTemporaryPassword();

      // Resetear contraseña en Keycloak como NO temporal
      // Cambiamos a false para que pueda hacer login inmediatamente
      await this.keycloakAdminService.resetPassword(
        user.keycloakId,
        temporaryPassword,
        false, // NO temporal - el usuario puede hacer login inmediatamente
      );

      return {
        message:
          'Contraseña reseteada exitosamente. El usuario puede iniciar sesión con la contraseña proporcionada y cambiarla después desde su perfil.',
        temporaryPassword,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al resetear la contraseña');
    }
  }

  // ============================================
  // Método auxiliar para generar contraseña temporal
  // ============================================
  private generateTemporaryPassword(): string {
    const length = 12;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&';
    let password = '';

    // Asegurar que tenga al menos: 1 mayúscula, 1 minúscula, 1 número, 1 especial
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '@$!%*?&'[Math.floor(Math.random() * 7)];

    // Completar el resto
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Mezclar caracteres
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }
}
