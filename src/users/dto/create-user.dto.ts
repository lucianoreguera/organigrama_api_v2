import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsArray,
  IsOptional,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'ID de Keycloak del usuario',
    example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
  })
  @IsString()
  keycloakId: string;

  @ApiProperty({
    description: 'Nombre de usuario único',
    example: 'john_doe',
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'John',
    required: false,
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    description: 'DNI del usuario (solo números)',
    example: '12345678',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{7,8}$/, {
    message: 'El DNI debe contener entre 7 y 8 dígitos numéricos',
  })
  dni?: string;

  @ApiProperty({
    description: 'Roles del usuario en la aplicación',
    example: ['user'],
    type: [String],
  })
  @IsArray()
  roles: string[];

  @ApiProperty({
    description: 'Roles del realm de Keycloak',
    example: ['offline_access', 'uma_authorization'],
    type: [String],
  })
  @IsArray()
  realmRoles: string[];
}
