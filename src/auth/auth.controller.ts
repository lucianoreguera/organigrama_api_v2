// import {
//   Body,
//   Controller,
//   Post,
//   Get,
//   UseGuards,
//   Param,
//   HttpCode,
//   HttpStatus,
// } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
// import { Public } from 'nest-keycloak-connect';
// import { AuthService } from './auth.service';
// import { CurrentUser } from './decorators/current-user.decorator';
// import { RolesGuard } from './guards/roles.guard';
// import { RequireRoles } from './decorators/roles.decorator';
// import { RegisterDto } from './dto/register.dto';
// import {
//   ApiTags,
//   ApiOperation,
//   ApiResponse,
//   ApiBody,
//   ApiBearerAuth,
// } from '@nestjs/swagger';
// import { LoginDto } from './dto/login.dto';
// import { RefreshTokenDto } from './dto/refresh-token.dto';
// import {
//   LoginResponseDto,
//   MessageResponseDto,
//   ProfileResponseDto,
// } from './dto/response.dto';

// @ApiTags('Autenticación')
// @Controller('auth')
// export class AuthController {
//   constructor(private authService: AuthService) {}

//   @Public()
//   @Post('login')
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({
//     summary: 'Iniciar sesión de usuario',
//     description:
//       'Autentica a un usuario y devuelve tokens de acceso y de refresco.',
//   })
//   @ApiBody({ type: LoginDto })
//   @ApiResponse({
//     status: 200,
//     description: 'Login exitoso.',
//     type: LoginResponseDto,
//   })
//   @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
//   async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
//     return this.authService.login(loginDto);
//   }

//   @Public()
//   @Post('register')
//   @ApiOperation({
//     summary: 'Registrar un nuevo usuario',
//     description: 'Crea una nueva cuenta de usuario.',
//   })
//   @ApiResponse({
//     status: 201,
//     description: 'Usuario registrado exitosamente.',
//     type: MessageResponseDto,
//   })
//   @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
//   async register(
//     @Body() registerDto: RegisterDto,
//   ): Promise<MessageResponseDto> {
//     return this.authService.register(registerDto);
//   }

//   @Public()
//   @Post('refresh')
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({
//     summary: 'Refrescar token de acceso',
//     description:
//       'Genera un nuevo token de acceso usando un refresh token válido.',
//   })
//   @ApiBody({ type: RefreshTokenDto })
//   @ApiResponse({
//     status: 200,
//     description: 'Token refrescado exitosamente.',
//     type: LoginResponseDto,
//   })
//   @ApiResponse({
//     status: 401,
//     description: 'Refresh token inválido o expirado.',
//   })
//   async refreshToken(
//     @Body() refreshTokenDto: RefreshTokenDto,
//   ): Promise<LoginResponseDto> {
//     return this.authService.refreshToken(refreshTokenDto.refresh_token);
//   }

//   @Get('profile')
//   @UseGuards(AuthGuard('jwt'))
//   @ApiBearerAuth()
//   @ApiOperation({
//     summary: 'Obtener perfil del usuario',
//     description: 'Devuelve la información del perfil del usuario autenticado.',
//   })
//   @ApiResponse({
//     status: 200,
//     description: 'Perfil del usuario.',
//     type: ProfileResponseDto,
//   })
//   @ApiResponse({ status: 401, description: 'No autorizado.' })
//   async getProfile(@CurrentUser() user: any): Promise<ProfileResponseDto> {
//     return {
//       userId: user.userId,
//       username: user.username,
//       email: user.email,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
//       roles: user.roles,
//       realmRoles: user.realmRoles,
//     };
//   }

//   @Post('logout')
//   @UseGuards(AuthGuard('jwt'))
//   @HttpCode(HttpStatus.OK)
//   @ApiBearerAuth()
//   @ApiOperation({
//     summary: 'Cerrar sesión del usuario',
//     description: 'Invalida el refresh token del usuario.',
//   })
//   @ApiBody({ type: RefreshTokenDto })
//   @ApiResponse({
//     status: 200,
//     description: 'Logout exitoso.',
//     type: MessageResponseDto,
//   })
//   @ApiResponse({ status: 401, description: 'No autorizado.' })
//   async logout(
//     @Body() refreshTokenDto: RefreshTokenDto,
//   ): Promise<MessageResponseDto> {
//     await this.authService.logout(refreshTokenDto.refresh_token);
//     return { message: 'Logged out successfully' };
//   }

//   @Get('admin-only')
//   @UseGuards(AuthGuard('jwt'), RolesGuard)
//   @RequireRoles('admin')
//   @ApiBearerAuth()
//   @ApiOperation({
//     summary: 'Endpoint solo para administradores',
//     description:
//       'Un endpoint de prueba accesible solo por usuarios con el rol de "admin".',
//   })
//   @ApiResponse({
//     status: 200,
//     description: 'Acceso concedido.',
//     type: MessageResponseDto,
//   })
//   @ApiResponse({ status: 401, description: 'No autorizado.' })
//   @ApiResponse({ status: 403, description: 'Permisos insuficientes.' })
//   async adminEndpoint(@CurrentUser() user: any): Promise<MessageResponseDto> {
//     return {
//       message: `This is an admin-only endpoint. Welcome, ${user.username}!`,
//     };
//   }

//   // @Public()
//   // @Get('check-username/:username')
//   // @ApiOperation({
//   //   summary: 'Verificar disponibilidad de username',
//   //   description: 'Comprueba si un nombre de usuario ya está en uso.',
//   // })
//   // @ApiParam({
//   //   name: 'username',
//   //   description: 'El nombre de usuario a verificar.',
//   //   example: 'new_user',
//   // })
//   // @ApiResponse({
//   //   status: 200,
//   //   description: 'Resultado de la verificación.',
//   //   type: CheckUsernameResponseDto,
//   // })
//   // async checkUsername(
//   //   @Param('username') username: string,
//   // ): Promise<CheckUsernameResponseDto> {
//   //   const isAvailable = await this.authService.checkUsername(username);
//   //   return {
//   //     available: isAvailable,
//   //     message: isAvailable
//   //       ? 'El nombre de usuario está disponible.'
//   //       : 'El nombre de usuario ya está en uso.',
//   //   };
//   // }
// }

// import {
//   Body,
//   Controller,
//   Post,
//   Get,
//   UseGuards,
//   HttpCode,
//   HttpStatus,
//   Put,
// } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
// import { Public } from 'nest-keycloak-connect';
// import { AuthService } from './auth.service';
// import { CurrentUser } from './decorators/current-user.decorator';
// import { RegisterDto } from './dto/register.dto';
// import {
//   ApiTags,
//   ApiOperation,
//   ApiResponse,
//   ApiBody,
//   ApiBearerAuth,
// } from '@nestjs/swagger';
// import { LoginDto } from './dto/login.dto';
// import { RefreshTokenDto } from './dto/refresh-token.dto';
// import { ChangePasswordDto } from './dto/change-password.dto';
// import {
//   LoginResponseDto,
//   MessageResponseDto,
//   ProfileResponseDto,
// } from './dto/response.dto';

// @ApiTags('Autenticación')
// @Controller('auth')
// export class AuthController {
//   constructor(private authService: AuthService) {}

//   // ===================================
//   // 1. REGISTRO
//   // ===================================
//   @Public()
//   @Post('register')
//   @HttpCode(HttpStatus.CREATED)
//   @ApiOperation({
//     summary: 'Registrar un nuevo usuario',
//     description: 'Crea una nueva cuenta en Keycloak y MongoDB.',
//   })
//   @ApiBody({ type: RegisterDto })
//   @ApiResponse({
//     status: 201,
//     description: 'Usuario registrado exitosamente.',
//   })
//   @ApiResponse({
//     status: 400,
//     description: 'Datos inválidos o usuario ya existe.',
//   })
//   async register(@Body() registerDto: RegisterDto): Promise<{
//     message: string;
//     username: string;
//     userId: string;
//   }> {
//     return this.authService.register(registerDto);
//   }

//   // ===================================
//   // 2. LOGIN
//   // ===================================
//   @Public()
//   @Post('login')
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({
//     summary: 'Iniciar sesión',
//     description: 'Autentica y devuelve tokens de acceso.',
//   })
//   @ApiBody({ type: LoginDto })
//   @ApiResponse({
//     status: 200,
//     description: 'Login exitoso.',
//     type: LoginResponseDto,
//   })
//   @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
//   async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
//     return this.authService.login(loginDto);
//   }

//   // ===================================
//   // 3. REFRESH TOKEN
//   // ===================================
//   @Public()
//   @Post('refresh')
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({
//     summary: 'Refrescar token',
//     description: 'Genera un nuevo access token.',
//   })
//   @ApiBody({ type: RefreshTokenDto })
//   @ApiResponse({
//     status: 200,
//     description: 'Token refrescado.',
//     type: LoginResponseDto,
//   })
//   @ApiResponse({
//     status: 401,
//     description: 'Refresh token inválido.',
//   })
//   async refreshToken(
//     @Body() refreshTokenDto: RefreshTokenDto,
//   ): Promise<LoginResponseDto> {
//     return this.authService.refreshToken(refreshTokenDto.refresh_token);
//   }

//   // ===================================
//   // 4. LOGOUT
//   // ===================================
//   @Post('logout')
//   @UseGuards(AuthGuard('jwt'))
//   @HttpCode(HttpStatus.OK)
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({
//     summary: 'Cerrar sesión',
//     description: 'Invalida el refresh token.',
//   })
//   @ApiBody({ type: RefreshTokenDto })
//   @ApiResponse({
//     status: 200,
//     description: 'Logout exitoso.',
//     type: MessageResponseDto,
//   })
//   @ApiResponse({ status: 401, description: 'No autorizado.' })
//   async logout(
//     @Body() refreshTokenDto: RefreshTokenDto,
//   ): Promise<MessageResponseDto> {
//     await this.authService.logout(refreshTokenDto.refresh_token);
//     return { message: 'Sesión cerrada exitosamente' };
//   }

//   // ===================================
//   // 5. CAMBIAR CONTRASEÑA
//   // ===================================
//   @Put('change-password')
//   @UseGuards(AuthGuard('jwt'))
//   @HttpCode(HttpStatus.OK)
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({
//     summary: 'Cambiar contraseña',
//     description: 'Cambia la contraseña del usuario autenticado.',
//   })
//   @ApiBody({ type: ChangePasswordDto })
//   @ApiResponse({
//     status: 200,
//     description: 'Contraseña actualizada.',
//   })
//   @ApiResponse({
//     status: 400,
//     description: 'Contraseña actual incorrecta.',
//   })
//   @ApiResponse({ status: 401, description: 'No autorizado.' })
//   async changePassword(
//     @CurrentUser() user: any,
//     @Body() changePasswordDto: ChangePasswordDto,
//   ): Promise<MessageResponseDto> {
//     return this.authService.changePassword(user.userId, changePasswordDto);
//   }

//   // ===================================
//   // 6. PERFIL (BONUS)
//   // ===================================
//   @Get('profile')
//   @UseGuards(AuthGuard('jwt'))
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({
//     summary: 'Obtener perfil',
//     description: 'Devuelve info del usuario autenticado.',
//   })
//   @ApiResponse({
//     status: 200,
//     description: 'Perfil del usuario.',
//     type: ProfileResponseDto,
//   })
//   @ApiResponse({ status: 401, description: 'No autorizado.' })
//   async getProfile(@CurrentUser() user: any): Promise<ProfileResponseDto> {
//     return {
//       userId: user.userId,
//       username: user.username,
//       email: user.email,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
//       roles: user.roles,
//       realmRoles: user.realmRoles,
//     };
//   }
// }

// import {
//   Body,
//   Controller,
//   Post,
//   Get,
//   UseGuards,
//   HttpCode,
//   HttpStatus,
//   Put,
//   Request,
// } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
// import { Public } from 'nest-keycloak-connect';
// import { AuthService } from './auth.service';
// import { CurrentUser } from './decorators/current-user.decorator';
// import { RegisterDto } from './dto/register.dto';
// import { RolesGuard } from './guards/roles.guard';
// import { RequireRoles } from './decorators/roles.decorator';
// import {
//   ApiTags,
//   ApiOperation,
//   ApiResponse,
//   ApiBody,
//   ApiBearerAuth,
// } from '@nestjs/swagger';
// import { LoginDto } from './dto/login.dto';
// import { RefreshTokenDto } from './dto/refresh-token.dto';
// import { ChangePasswordDto } from './dto/change-password.dto';
// import { ResetPasswordByAdminDto } from './dto/reset-password-by-admin.dto';
// import {
//   LoginResponseDto,
//   MessageResponseDto,
//   ProfileResponseDto,
// } from './dto/response.dto';

// @ApiTags('Autenticación')
// @Controller('auth')
// export class AuthController {
//   constructor(private authService: AuthService) {}

//   // ===================================
//   // 1. REGISTRO
//   // ===================================
//   @Public()
//   @Post('register')
//   @HttpCode(HttpStatus.CREATED)
//   @ApiOperation({
//     summary: 'Registrar un nuevo usuario',
//     description: 'Crea una nueva cuenta en Keycloak y MongoDB.',
//   })
//   @ApiBody({ type: RegisterDto })
//   @ApiResponse({
//     status: 201,
//     description: 'Usuario registrado exitosamente.',
//     schema: {
//       example: {
//         message: 'Usuario registrado exitosamente',
//         username: 'john_doe',
//         userId: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
//       },
//     },
//   })
//   @ApiResponse({
//     status: 400,
//     description: 'Datos inválidos o usuario ya existe.',
//   })
//   async register(@Body() registerDto: RegisterDto): Promise<{
//     message: string;
//     username: string;
//     userId: string;
//   }> {
//     return this.authService.register(registerDto);
//   }

//   // ===================================
//   // 2. LOGIN
//   // ===================================
//   @Public()
//   @Post('login')
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({
//     summary: 'Iniciar sesión',
//     description: 'Autentica y devuelve tokens de acceso.',
//   })
//   @ApiBody({ type: LoginDto })
//   @ApiResponse({
//     status: 200,
//     description: 'Login exitoso.',
//     type: LoginResponseDto,
//   })
//   @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
//   async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
//     return this.authService.login(loginDto);
//   }

//   // ===================================
//   // 3. REFRESH TOKEN
//   // ===================================
//   @Public()
//   @Post('refresh')
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({
//     summary: 'Refrescar token',
//     description: 'Genera un nuevo access token.',
//   })
//   @ApiBody({ type: RefreshTokenDto })
//   @ApiResponse({
//     status: 200,
//     description: 'Token refrescado.',
//     type: LoginResponseDto,
//   })
//   @ApiResponse({
//     status: 401,
//     description: 'Refresh token inválido.',
//   })
//   async refreshToken(
//     @Body() refreshTokenDto: RefreshTokenDto,
//   ): Promise<LoginResponseDto> {
//     return this.authService.refreshToken(refreshTokenDto.refresh_token);
//   }

//   // ===================================
//   // 4. LOGOUT
//   // ===================================
//   @Post('logout')
//   @UseGuards(AuthGuard('jwt'))
//   @HttpCode(HttpStatus.OK)
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({
//     summary: 'Cerrar sesión',
//     description: 'Invalida el refresh token.',
//   })
//   @ApiBody({ type: RefreshTokenDto })
//   @ApiResponse({
//     status: 200,
//     description: 'Logout exitoso.',
//     type: MessageResponseDto,
//   })
//   @ApiResponse({ status: 401, description: 'No autorizado.' })
//   async logout(
//     @Body() refreshTokenDto: RefreshTokenDto,
//   ): Promise<MessageResponseDto> {
//     await this.authService.logout(refreshTokenDto.refresh_token);
//     return { message: 'Sesión cerrada exitosamente' };
//   }

//   // ===================================
//   // 5. CAMBIAR CONTRASEÑA (Usuario)
//   // ===================================
//   @Put('change-password')
//   @UseGuards(AuthGuard('jwt'))
//   @HttpCode(HttpStatus.OK)
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({
//     summary: 'Cambiar contraseña (usuario)',
//     description:
//       'Permite al usuario autenticado cambiar su propia contraseña conociendo la actual.',
//   })
//   @ApiBody({ type: ChangePasswordDto })
//   @ApiResponse({
//     status: 200,
//     description: 'Contraseña actualizada exitosamente.',
//     schema: {
//       example: {
//         message:
//           'Contraseña actualizada exitosamente. Por favor, inicia sesión nuevamente con tu nueva contraseña.',
//       },
//     },
//   })
//   @ApiResponse({
//     status: 400,
//     description:
//       'Contraseña actual incorrecta o nueva contraseña no cumple requisitos.',
//   })
//   @ApiResponse({ status: 401, description: 'No autorizado.' })
//   async changePassword(
//     @CurrentUser() user: any,
//     @Body() changePasswordDto: ChangePasswordDto,
//   ): Promise<MessageResponseDto> {
//     return this.authService.changePassword(
//       user.userId,
//       user.username,
//       changePasswordDto,
//     );
//   }

//   // ===================================
//   // 6. RESETEAR CONTRASEÑA (Admin)
//   // ===================================
//   @Post('reset-password')
//   @UseGuards(AuthGuard('jwt'), RolesGuard)
//   @RequireRoles('admin')
//   @HttpCode(HttpStatus.OK)
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({
//     summary: 'Resetear contraseña (admin)',
//     description:
//       'Permite a un admin resetear la contraseña de cualquier usuario. Genera una contraseña temporal que el usuario debe cambiar en el próximo login.',
//   })
//   @ApiBody({ type: ResetPasswordByAdminDto })
//   @ApiResponse({
//     status: 200,
//     description: 'Contraseña reseteada exitosamente.',
//     schema: {
//       example: {
//         message:
//           'Contraseña reseteada exitosamente. El usuario debe cambiarla en el próximo inicio de sesión.',
//         temporaryPassword: 'Temp123!@#abc',
//       },
//     },
//   })
//   @ApiResponse({
//     status: 400,
//     description: 'Usuario no encontrado.',
//   })
//   @ApiResponse({ status: 401, description: 'No autorizado.' })
//   @ApiResponse({
//     status: 403,
//     description: 'Permisos insuficientes (requiere rol admin).',
//   })
//   async resetPasswordByAdmin(
//     @Body() resetDto: ResetPasswordByAdminDto,
//   ): Promise<{ message: string; temporaryPassword: string }> {
//     return this.authService.resetPasswordByAdmin(resetDto);
//   }

//   // ===================================
//   // 7. PERFIL (BONUS)
//   // ===================================
//   @Get('profile')
//   @UseGuards(AuthGuard('jwt'))
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({
//     summary: 'Obtener perfil',
//     description: 'Devuelve información del usuario autenticado.',
//   })
//   @ApiResponse({
//     status: 200,
//     description: 'Perfil del usuario.',
//     type: ProfileResponseDto,
//   })
//   @ApiResponse({ status: 401, description: 'No autorizado.' })
//   async getProfile(@CurrentUser() user: any): Promise<ProfileResponseDto> {
//     return {
//       userId: user.userId,
//       username: user.username,
//       email: user.email,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
//       roles: user.roles,
//       realmRoles: user.realmRoles,
//     };
//   }
// }

import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Put,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Public } from 'nest-keycloak-connect';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { RolesGuard } from './guards/roles.guard';
import { RequireRoles } from './decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordByAdminDto } from './dto/reset-password-by-admin.dto';
import {
  LoginResponseDto,
  MessageResponseDto,
  ProfileResponseDto,
} from './dto/response.dto';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @RequireRoles('admin')
  @ApiBearerAuth('JWT-auth')
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un nuevo usuario',
    description: 'Crea una nueva cuenta en Keycloak y MongoDB.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente.',
    schema: {
      example: {
        message: 'Usuario registrado exitosamente',
        username: 'john_doe',
        userId: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o usuario ya existe.',
  })
  async register(@Body() registerDto: RegisterDto): Promise<{
    message: string;
    username: string;
    userId: string;
  }> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Autentica y devuelve tokens de acceso.',
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
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refrescar token',
    description: 'Genera un nuevo access token.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token refrescado.',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido.',
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<LoginResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cerrar sesión',
    description: 'Invalida el refresh token.',
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
    return { message: 'Sesión cerrada exitosamente' };
  }

  @Put('change-password')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cambiar contraseña (usuario)',
    description:
      'Permite al usuario autenticado cambiar su propia contraseña conociendo la actual.',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Contraseña actualizada exitosamente.',
    schema: {
      example: {
        message:
          'Contraseña actualizada exitosamente. Por favor, inicia sesión nuevamente con tu nueva contraseña.',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Contraseña actual incorrecta o nueva contraseña no cumple requisitos.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<MessageResponseDto> {
    return this.authService.changePassword(
      user.userId,
      user.username,
      changePasswordDto,
    );
  }

  @Post('reset-password')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @RequireRoles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Resetear contraseña (admin)',
    description:
      'Permite a un admin resetear la contraseña de cualquier usuario. Genera una contraseña temporal que el usuario puede usar para iniciar sesión inmediatamente. Se recomienda que el usuario la cambie después desde su perfil.',
  })
  @ApiBody({ type: ResetPasswordByAdminDto })
  @ApiResponse({
    status: 200,
    description: 'Contraseña reseteada exitosamente.',
    schema: {
      example: {
        message:
          'Contraseña reseteada exitosamente. El usuario puede iniciar sesión con la contraseña proporcionada y cambiarla después desde su perfil.',
        temporaryPassword: 'Temp123!@#abc',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Usuario no encontrado.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes (requiere rol admin).',
  })
  async resetPasswordByAdmin(
    @Body() resetDto: ResetPasswordByAdminDto,
  ): Promise<{ message: string; temporaryPassword: string }> {
    return this.authService.resetPasswordByAdmin(resetDto);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener perfil',
    description: 'Devuelve información del usuario autenticado.',
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
}
