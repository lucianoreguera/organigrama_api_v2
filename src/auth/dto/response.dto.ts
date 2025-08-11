import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT de acceso',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'JWT para refrescar el token de acceso',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refresh_token: string;
}

export class ProfileResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6' })
  userId: string;

  @ApiProperty({ example: 'john_doe' })
  username: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiProperty({ example: ['user'] })
  roles: string[];

  @ApiProperty({ example: ['offline_access', 'uma_authorization'] })
  realmRoles: string[];
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Operación realizada con éxito' })
  message: string;
}

export class CheckUsernameResponseDto {
  @ApiProperty({ example: true })
  available: boolean;

  @ApiProperty({ example: 'El nombre de usuario está disponible.' })
  message: string;
}
