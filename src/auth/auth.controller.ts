import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Public } from 'nest-keycloak-connect';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { RolesGuard } from './guards/roles.guard';
import { RequireRoles } from './decorators/roles.decorator';
import { RegisterDto } from './dto/register.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  LoginResponseDto,
  MessageResponseDto,
  ProfileResponseDto,
} from './dto/response.dto';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión de usuario',
    description:
      'Autentica a un usuario y devuelve tokens de acceso y de refresco.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso.',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Registrar un nuevo usuario',
    description: 'Crea una nueva cuenta de usuario.',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente.',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<MessageResponseDto> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refrescar token de acceso',
    description:
      'Genera un nuevo token de acceso usando un refresh token válido.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token refrescado exitosamente.',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido o expirado.',
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<LoginResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener perfil del usuario',
    description: 'Devuelve la información del perfil del usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario.',
    type: ProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  async getProfile(@CurrentUser() user: any): Promise<ProfileResponseDto> {
    return {
      userId: user.userId,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      roles: user.roles,
      realmRoles: user.realmRoles,
    };
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cerrar sesión del usuario',
    description: 'Invalida el refresh token del usuario.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Logout exitoso.',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  async logout(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<MessageResponseDto> {
    await this.authService.logout(refreshTokenDto.refresh_token);
    return { message: 'Logged out successfully' };
  }

  @Get('admin-only')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @RequireRoles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Endpoint solo para administradores',
    description:
      'Un endpoint de prueba accesible solo por usuarios con el rol de "admin".',
  })
  @ApiResponse({
    status: 200,
    description: 'Acceso concedido.',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes.' })
  async adminEndpoint(@CurrentUser() user: any): Promise<MessageResponseDto> {
    return {
      message: `This is an admin-only endpoint. Welcome, ${user.username}!`,
    };
  }

  // @Public()
  // @Get('check-username/:username')
  // @ApiOperation({
  //   summary: 'Verificar disponibilidad de username',
  //   description: 'Comprueba si un nombre de usuario ya está en uso.',
  // })
  // @ApiParam({
  //   name: 'username',
  //   description: 'El nombre de usuario a verificar.',
  //   example: 'new_user',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Resultado de la verificación.',
  //   type: CheckUsernameResponseDto,
  // })
  // async checkUsername(
  //   @Param('username') username: string,
  // ): Promise<CheckUsernameResponseDto> {
  //   const isAvailable = await this.authService.checkUsername(username);
  //   return {
  //     available: isAvailable,
  //     message: isAvailable
  //       ? 'El nombre de usuario está disponible.'
  //       : 'El nombre de usuario ya está en uso.',
  //   };
  // }
}
