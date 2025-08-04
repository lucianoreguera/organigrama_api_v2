import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  KeycloakAdminService,
  CreateKeycloakUserDto,
} from './keycloak-admin.service';
import { RegisterDto } from './dto/register.dto';

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
  ) {
    this.keycloakUrl = this.configService.get('KEYCLOAK_BASE_URL')!;
    this.realm = this.configService.get('KEYCLOAK_REALM')!;
    this.clientId = this.configService.get('KEYCLOAK_CLIENT_ID')!;
    this.clientSecret = this.configService.get('KEYCLOAK_CLIENT_SECRET')!;
  }

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

  // AGREGAR ESTE MÉTODO al final de la clase AuthService
  /**
   * Registra un nuevo usuario en Keycloak
   */
  async register(registerDto: RegisterDto): Promise<{
    message: string;
    username: string;
    userId: string;
  }> {
    try {
      // Crear usuario en Keycloak
      const keycloakUser = await this.keycloakAdminService.createUser({
        username: registerDto.username,
        password: registerDto.password,
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        temporary: false,
      });

      console.log(
        `✅ Usuario registrado exitosamente: ${registerDto.username}`,
      );

      return {
        message: 'Usuario registrado exitosamente',
        username: keycloakUser.username,
        userId: keycloakUser.id,
      };
    } catch (error) {
      console.error('Error en registro de usuario:', error);
      throw error; // Re-lanzar el error para que el controller lo maneje
    }
  }
}
