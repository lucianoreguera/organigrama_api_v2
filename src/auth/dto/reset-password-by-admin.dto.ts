import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ResetPasswordByAdminDto {
  @ApiProperty({
    description: 'El nombre de usuario cuya contraseña será reseteada',
    example: 'john_doe',
  })
  @IsString()
  @IsNotEmpty()
  username: string;
}
