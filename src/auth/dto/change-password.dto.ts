// import { ApiProperty } from '@nestjs/swagger';
// import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

// export class ChangePasswordDto {
//   @ApiProperty({
//     description: 'El nombre de usuario para verificación',
//     example: 'john_doe',
//   })
//   @IsString()
//   username: string;

//   @ApiProperty({
//     description: 'La contraseña actual del usuario',
//     example: 'OldPassword123!',
//   })
//   @IsString()
//   @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
//   currentPassword: string;

//   @ApiProperty({
//     description: 'La nueva contraseña. Debe ser segura.',
//     example: 'NewPassword123!',
//     minLength: 8,
//     maxLength: 128,
//   })
//   @IsString()
//   @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
//   @MaxLength(128, {
//     message: 'La contraseña no puede tener más de 128 caracteres',
//   })
//   @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
//     message:
//       'La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial',
//   })
//   newPassword: string;
// }

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'La contraseña actual del usuario',
    example: 'OldPassword123!',
  })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  currentPassword: string;

  @ApiProperty({
    description: 'La nueva contraseña. Debe ser segura.',
    example: 'NewPassword123!',
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
  newPassword: string;
}
