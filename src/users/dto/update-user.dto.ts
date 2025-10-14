import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, Matches } from 'class-validator';

export class UpdateUserDto {
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
    description: 'Correo electrónico del usuario',
    example: 'john.doe@example.com',
    required: false,
  })
  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'DNI del usuario (solo números)',
    example: '12345678',
    required: false,
    minLength: 7,
    maxLength: 8,
  })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{7,8}$/, {
    message: 'El DNI debe contener entre 7 y 8 dígitos numéricos',
  })
  dni?: string;
}
