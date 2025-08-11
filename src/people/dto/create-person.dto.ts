import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PersonType } from '../enums/person-type.enums';
import { SocialNetworksDto } from './social-networks.dto';

export class CreatePersonDto {
  @ApiProperty({
    description: 'Nombre de la persona',
    example: 'Juan Carlos',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MaxLength(100, { message: 'El nombre no puede exceder los 100 caracteres' })
  firstname: string;

  @ApiProperty({
    description: 'Apellido de la persona',
    example: 'Pérez González',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'El apellido es requerido' })
  @MaxLength(100, {
    message: 'El apellido no puede exceder los 100 caracteres',
  })
  lastname: string;

  @ApiProperty({
    description: 'CUIL de la persona en formato XX-XXXXXXXX-X',
    example: '20-12345678-9',
    pattern: '^\\d{2}-\\d{8}-\\d{1}$',
  })
  @IsString()
  @IsNotEmpty({ message: 'El CUIL es requerido' })
  @Matches(/^\d{2}-\d{8}-\d{1}$/, {
    message: 'El CUIL debe tener el formato XX-XXXXXXXX-X',
  })
  cuil: string;

  @ApiProperty({
    description: 'Tipo de persona en el sistema',
    enum: PersonType,
    example: PersonType.OFFICIAL,
    enumName: 'PersonType',
  })
  @IsEnum(PersonType, {
    message: `El tipo de persona debe ser uno de los siguientes valores: ${Object.values(PersonType).join(', ')}`,
  })
  @IsNotEmpty({ message: 'El tipo de persona es requerido' })
  person_type: PersonType;

  @ApiPropertyOptional({
    description: 'Correo electrónico de la persona',
    example: 'juan.perez@gobierno.ar',
    format: 'email',
    maxLength: 100,
  })
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  @MaxLength(100, { message: 'El email no puede exceder los 100 caracteres' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono de contacto',
    example: '+54 9 383 123-4567',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'El teléfono no puede exceder los 20 caracteres' })
  phone_number?: string;

  @ApiPropertyOptional({
    description: 'URL de la foto de perfil de la persona',
    example: 'https://example.com/photos/juan-perez.jpg',
    format: 'uri',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: 'La URL de la foto no puede exceder los 255 caracteres',
  })
  photo_url?: string;

  @ApiPropertyOptional({
    description: 'Biografía o descripción de la persona',
    example:
      'Funcionario con más de 10 años de experiencia en administración pública...',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Redes sociales de la persona',
    type: SocialNetworksDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialNetworksDto)
  social_networks?: SocialNetworksDto;

  @ApiPropertyOptional({
    description: 'Título del puesto (requerido solo para funcionarios)',
    example: 'Jefe de Departamento de Recursos Humanos',
    maxLength: 150,
  })
  @ValidateIf((o) => o.person_type === PersonType.OFFICIAL)
  @IsNotEmpty({
    message: 'El título del puesto es requerido para un funcionario',
  })
  @IsString()
  @MaxLength(150, { message: 'El título no puede exceder los 150 caracteres' })
  job_title_text?: string;

  @ApiPropertyOptional({
    description: 'Área de especialización (requerido solo para asesores)',
    example: 'Derecho Administrativo y Gestión Pública',
    maxLength: 150,
  })
  @ValidateIf((o) => o.person_type === PersonType.ASSESSOR)
  @IsNotEmpty({
    message: 'El área de especialización es requerida para un asesor',
  })
  @IsString()
  @MaxLength(150, {
    message: 'El área de especialización no puede exceder los 150 caracteres',
  })
  expertise_area?: string;

  @ApiPropertyOptional({
    description: 'Indica si la persona está activa en el sistema',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;
}
