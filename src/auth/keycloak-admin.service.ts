import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

export interface CreateKeycloakUserDto {
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  password: string;
  temporary?: boolean;
}

export interface KeycloakUserResponse {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled: boolean;
}

@Injectable()
export class KeycloakAdminService {
  private readonly keycloakBaseUrl: string;
  private readonly realm: string;
  private readonly adminUsername: string;
  private readonly adminPassword: string;
  private readonly clientId: string;

  constructor(private configService: ConfigService) {
    this.keycloakBaseUrl = this.configService.get<string>('KEYCLOAK_BASE_URL')!;
    this.realm = this.configService.get<string>('KEYCLOAK_REALM')!;
    this.adminUsername = this.configService.get<string>(
      'KEYCLOAK_ADMIN_USERNAME',
    )!;
    this.adminPassword = this.configService.get<string>(
      'KEYCLOAK_ADMIN_PASSWORD',
    )!;
    this.clientId = this.configService.get<string>('KEYCLOAK_CLIENT_ID')!;
  }

  /**
   * Obtiene token de administrador para usar Keycloak Admin API
   */
  private async getAdminToken(): Promise<string> {
    try {
      // Intentar primero con el realm actual
      let url = `${this.keycloakBaseUrl}/realms/${this.realm}/protocol/openid-connect/token`;

      const params = new URLSearchParams();
      params.append('grant_type', 'password');
      params.append('client_id', 'admin-cli');
      params.append('username', this.adminUsername);
      params.append('password', this.adminPassword);

      let response;
      try {
        response = await axios.post(url, params, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
      } catch (firstError) {
        // Si falla, intentar con el realm master
        url = `${this.keycloakBaseUrl}/realms/master/protocol/openid-connect/token`;

        response = await axios.post(url, params, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
      }

      return response.data.access_token;
    } catch (error) {
      throw new InternalServerErrorException(
        'Error de configuración de Keycloak: credenciales de admin incorrectas',
      );
    }
  }

  /**
   * Verifica si un usuario ya existe en Keycloak
   */
  private async userExists(username: string, email?: string): Promise<boolean> {
    try {
      const adminToken = await this.getAdminToken();
      const url = `${this.keycloakBaseUrl}/admin/realms/${this.realm}/users`;

      // Buscar por username
      const usernameResponse = await axios.get(url, {
        params: { username, exact: true },
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (usernameResponse.data.length > 0) {
        return true;
      }

      // Buscar por email si se proporciona
      if (email) {
        const emailResponse = await axios.get(url, {
          params: { email, exact: true },
          headers: { Authorization: `Bearer ${adminToken}` },
        });

        if (emailResponse.data.length > 0) {
          return true;
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Crea un nuevo usuario en Keycloak
   */
  async createUser(
    userData: CreateKeycloakUserDto,
  ): Promise<KeycloakUserResponse> {
    try {
      // Verificar si el usuario ya existe
      const exists = await this.userExists(userData.username, userData.email);
      if (exists) {
        throw new BadRequestException('El usuario o email ya existe');
      }

      const adminToken = await this.getAdminToken();
      const url = `${this.keycloakBaseUrl}/admin/realms/${this.realm}/users`;

      const keycloakUser = {
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        enabled: true,
        emailVerified: false,
        credentials: userData.password
          ? [
              {
                type: 'password',
                value: userData.password,
                temporary: userData.temporary || false,
              },
            ]
          : [],
      };

      const response = await axios.post(url, keycloakUser, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      // Keycloak retorna el ID en el header Location
      const locationHeader = response.headers.location;
      if (!locationHeader) {
        throw new InternalServerErrorException(
          'No se pudo obtener el ID del usuario creado',
        );
      }

      const userId = locationHeader.split('/').pop();

      // Asignar rol básico de usuario
      await this.assignUserRole(userId!, 'user');

      return {
        id: userId!,
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        enabled: true,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        if (axiosError.response?.status === 409) {
          throw new BadRequestException('El usuario ya existe');
        }

        if (axiosError.response?.status === 400) {
          const errorData = axiosError.response.data as any;
          const errorMessage =
            errorData?.errorMessage || 'Datos de usuario inválidos';
          throw new BadRequestException(errorMessage);
        }
      }

      throw new InternalServerErrorException('Error interno al crear usuario');
    }
  }

  /**
   * Asigna un rol a un usuario en Keycloak
   */
  private async assignUserRole(
    userId: string,
    roleName: string,
  ): Promise<void> {
    try {
      const adminToken = await this.getAdminToken();

      // 1. Obtener el cliente
      const rolesUrl = `${this.keycloakBaseUrl}/admin/realms/${this.realm}/clients`;
      const clientsResponse = await axios.get(rolesUrl, {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { clientId: this.clientId },
      });

      const client = clientsResponse.data[0];
      if (!client) {
        return;
      }

      // 2. Obtener los roles del cliente
      const clientRolesUrl = `${this.keycloakBaseUrl}/admin/realms/${this.realm}/clients/${client.id}/roles`;
      const rolesResponse = await axios.get(clientRolesUrl, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const role = rolesResponse.data.find((r: any) => r.name === roleName);
      if (!role) {
        return;
      }

      // 3. Asignar el rol al usuario
      const assignRoleUrl = `${this.keycloakBaseUrl}/admin/realms/${this.realm}/users/${userId}/role-mappings/clients/${client.id}`;
      await axios.post(assignRoleUrl, [role], {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      // No lanzamos error porque el usuario ya fue creado exitosamente
      console.log('Error asignando rol (no crítico):', error.message);
    }
  }

  /**
   * Elimina un usuario de Keycloak (para rollback)
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const adminToken = await this.getAdminToken();
      const url = `${this.keycloakBaseUrl}/admin/realms/${this.realm}/users/${userId}`;

      await axios.delete(url, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    } catch (error) {
      throw new InternalServerErrorException('Error eliminando usuario');
    }
  }

  /**
   * Obtiene información de un usuario por ID
   */
  async getUserById(userId: string): Promise<KeycloakUserResponse | null> {
    try {
      const adminToken = await this.getAdminToken();
      const url = `${this.keycloakBaseUrl}/admin/realms/${this.realm}/users/${userId}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw new InternalServerErrorException('Error obteniendo usuario');
    }
  }

  /**
   * NUEVO: Resetea la contraseña de un usuario en Keycloak
   */
  async resetPassword(
    userId: string,
    newPassword: string,
    temporary: boolean = false,
  ): Promise<void> {
    try {
      const adminToken = await this.getAdminToken();
      const url = `${this.keycloakBaseUrl}/admin/realms/${this.realm}/users/${userId}/reset-password`;

      console.log('Intentando cambiar contraseña para userId:', userId);
      console.log('URL:', url);

      const response = await axios.put(
        url,
        {
          type: 'password',
          value: newPassword,
          temporary: temporary, // USAR EL PARÁMETRO
        },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('Contraseña cambiada exitosamente');
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        console.error('Status:', axiosError.response?.status);
        console.error('Data:', axiosError.response?.data);

        if (axiosError.response?.status === 404) {
          throw new BadRequestException('Usuario no encontrado en Keycloak');
        }

        if (axiosError.response?.status === 400) {
          const errorData = axiosError.response.data as any;
          const errorMessage =
            errorData?.errorMessage ||
            'La contraseña no cumple con los requisitos de Keycloak';
          throw new BadRequestException(errorMessage);
        }

        if (
          axiosError.response?.status === 401 ||
          axiosError.response?.status === 403
        ) {
          throw new InternalServerErrorException(
            'Error de autenticación con Keycloak Admin API',
          );
        }
      }

      throw new InternalServerErrorException(
        'Error al cambiar contraseña en Keycloak: ' + error.message,
      );
    }
  }
}
