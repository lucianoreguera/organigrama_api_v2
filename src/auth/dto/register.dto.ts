import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'El nombre de usuario único para el login.',
    example: 'john_doe',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @MinLength(3, { message: 'El username debe tener al menos 3 caracteres' })
  @MaxLength(50, { message: 'El username no puede tener más de 50 caracteres' })
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message:
      'El username solo puede contener letras, números, puntos, guiones y guiones bajos',
  })
  username: string;

  @ApiProperty({
    description: 'La contraseña del usuario. Debe ser segura.',
    example: 'Password123!',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(128, {
    message: 'La contraseña no puede tener más de 128 caracteres',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial',
  })
  password: string;

  @ApiProperty({
    description: 'El email del usuario (opcional).',
    example: 'john.doe@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Formato de email inválido' })
  @MaxLength(100, { message: 'El email no puede tener más de 100 caracteres' })
  email?: string;

  @ApiProperty({
    description: 'El nombre del usuario (opcional).',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'El nombre no puede tener más de 50 caracteres' })
  firstName?: string;

  @ApiProperty({
    description: 'El apellido del usuario (opcional).',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'El apellido no puede tener más de 50 caracteres' })
  lastName?: string;
}
