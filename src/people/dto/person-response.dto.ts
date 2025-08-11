import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PersonType } from '../enums/person-type.enums';
import { SocialNetworksDto } from './social-networks.dto';

export class PersonResponseDto {
  @ApiProperty({
    description: 'ID único de la persona',
    example: '507f1f77bcf86cd799439011',
  })
  _id: string;

  @ApiProperty({
    description: 'Nombre de la persona',
    example: 'Juan Carlos',
  })
  firstname: string;

  @ApiProperty({
    description: 'Apellido de la persona',
    example: 'Pérez González',
  })
  lastname: string;

  @ApiProperty({
    description: 'CUIL de la persona',
    example: '20-12345678-9',
  })
  cuil: string;

  @ApiProperty({
    description: 'Tipo de persona',
    enum: PersonType,
    example: PersonType.OFFICIAL,
  })
  person_type: PersonType;

  @ApiPropertyOptional({
    description: 'Correo electrónico',
    example: 'juan.perez@gobierno.ar',
  })
  email?: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono',
    example: '+54 9 383 123-4567',
  })
  phone_number?: string;

  @ApiPropertyOptional({
    description: 'URL de la foto de perfil',
    example: 'https://example.com/photos/juan-perez.jpg',
  })
  photo_url?: string;

  @ApiPropertyOptional({
    description: 'Biografía de la persona',
    example: 'Funcionario con más de 10 años de experiencia...',
  })
  bio?: string;

  @ApiPropertyOptional({
    description: 'Redes sociales',
    type: SocialNetworksDto,
  })
  social_networks?: SocialNetworksDto;

  @ApiPropertyOptional({
    description: 'Título del puesto (solo para funcionarios)',
    example: 'Jefe de Departamento de Recursos Humanos',
  })
  job_title_text?: string;

  @ApiPropertyOptional({
    description: 'Área de especialización (solo para asesores)',
    example: 'Derecho Administrativo y Gestión Pública',
  })
  expertise_area?: string;

  @ApiProperty({
    description: 'Indica si la persona está activa',
    example: true,
  })
  is_active: boolean;

  @ApiProperty({
    description: 'Fecha de creación del registro',
    example: '2024-01-15T10:30:00Z',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2024-01-20T15:45:00Z',
    format: 'date-time',
  })
  updatedAt: Date;
}
