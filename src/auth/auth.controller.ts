import { Body, Controller, Post, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AuthService, LoginDto } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { RolesGuard } from './guards/roles.guard';
import { RequireRoles } from './decorators/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  async refreshToken(@Body('refresh_token') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@CurrentUser() user: any) {
    console.log('🔥 LLEGÓ AL CONTROLLER PROFILE');
    return {
      userId: user.userId,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`,
      roles: user.roles,
      realmRoles: user.realmRoles,
      // debug: user.fullPayload, // Para ver toda la info
    };
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Body('refresh_token') refreshToken: string) {
    await this.authService.logout(refreshToken);
    return { message: 'Logged out successfully' };
  }

  @Get('admin-only')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @RequireRoles('admin')
  async adminEndpoint(@CurrentUser() user: any) {
    return {
      message: 'This is an admin-only endpoint',
      user: user.username,
      roles: user.roles,
    };
  }
}
