import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3, { message: 'El username debe tener al menos 3 caracteres' })
  @MaxLength(50, { message: 'El username no puede tener más de 50 caracteres' })
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message:
      'El username solo puede contener letras, números, puntos, guiones y guiones bajos',
  })
  username: string;

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

  @IsOptional()
  @IsEmail({}, { message: 'Formato de email inválido' })
  @MaxLength(100, { message: 'El email no puede tener más de 100 caracteres' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'El nombre no puede tener más de 50 caracteres' })
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'El apellido no puede tener más de 50 caracteres' })
  lastName?: string;
}
