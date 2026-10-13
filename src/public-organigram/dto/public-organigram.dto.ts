import { ApiProperty } from '@nestjs/swagger';
import { PersonType } from '../../people/enums/person-type.enums';
import { SocialNetworksDto } from '../../people/dto/social-networks.dto';

export class SecretariaResponseDto {
  @ApiProperty({
    description: 'ID del nodo de la secretaría',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre de la secretaría',
    example: 'Secretaría de Obras Públicas',
  })
  nombre: string;

  @ApiProperty({
    description: 'Código del departamento',
    example: 'SOP',
    required: false,
  })
  codigo?: string;

  @ApiProperty({
    description: 'Objetivo del departamento',
    required: false,
  })
  objetivo?: string;
}

export class DepartmentFlatResponseDto {
  @ApiProperty({
    description: 'ID del nodo del departamento',
    example: '507f1f77bcf86cd799439012',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre del departamento',
    example: 'Dirección de Arquitectura',
  })
  nombre: string;

  @ApiProperty({
    description: 'Código del departamento',
    example: 'DA',
    required: false,
  })
  codigo?: string;

  @ApiProperty({
    description: 'Nombre del nivel jerárquico',
    example: 'dirección',
  })
  nivel: string;

  @ApiProperty({
    description: 'Path jerárquico completo',
    example: 'Secretaría de Obras Públicas/Dirección de Arquitectura',
    required: false,
  })
  path_jerarquico?: string;

  @ApiProperty({
    description: 'Profundidad en la jerarquía (0 = raíz)',
    example: 2,
  })
  profundidad: number;
}

export enum PersonaRol {
  RESPONSABLE = 'responsable',
  ASESOR = 'asesor',
}

export class PersonaCargoDto {
  @ApiProperty({
    description: 'Rol de la persona en el nodo',
    enum: PersonaRol,
    example: PersonaRol.RESPONSABLE,
  })
  rol: PersonaRol;

  @ApiProperty({
    description: 'ID del nodo del departamento',
    example: '507f1f77bcf86cd799439012',
  })
  nodo_id: string;

  @ApiProperty({
    description: 'Nombre del departamento',
    example: 'Dirección de Arquitectura',
  })
  departamento: string;

  @ApiProperty({
    description: 'Código del departamento',
    example: 'DA',
    required: false,
  })
  codigo?: string;

  @ApiProperty({
    description: 'Nombre del nivel jerárquico',
    example: 'dirección',
  })
  nivel: string;

  @ApiProperty({
    description: 'Path jerárquico completo',
    example: 'Secretaría de Obras Públicas/Dirección de Arquitectura',
    required: false,
  })
  path_jerarquico?: string;

  @ApiProperty({
    description: 'Profundidad en la jerarquía (0 = raíz)',
    example: 2,
  })
  profundidad: number;
}

export class PersonaPublicaResponseDto {
  @ApiProperty({
    description: 'ID de la persona',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({ description: 'Nombre', example: 'juan carlos' })
  nombre: string;

  @ApiProperty({ description: 'Apellido', example: 'pérez' })
  apellido: string;

  @ApiProperty({ description: 'CUIL', example: '20-12345678-9' })
  cuil: string;

  @ApiProperty({
    description: 'Tipo de persona',
    enum: PersonType,
    example: PersonType.OFFICIAL,
  })
  tipo: PersonType;

  @ApiProperty({
    description: 'Correo electrónico',
    example: 'juan.perez@gobierno.ar',
    required: false,
  })
  email?: string;

  @ApiProperty({
    description: 'Número de teléfono',
    example: '+54 9 383 123-4567',
    required: false,
  })
  telefono?: string;

  @ApiProperty({
    description: 'URL de la foto de perfil',
    required: false,
  })
  foto_url?: string;

  @ApiProperty({ description: 'Biografía', required: false })
  bio?: string;

  @ApiProperty({
    description: 'Redes sociales',
    type: SocialNetworksDto,
    required: false,
  })
  redes_sociales?: SocialNetworksDto;

  @ApiProperty({
    description: 'Título del puesto (solo para funcionarios)',
    example: 'secretario de hacienda',
    required: false,
  })
  titulo_cargo?: string;

  @ApiProperty({
    description: 'Área de especialización (solo para asesores)',
    example: 'legal',
    required: false,
  })
  area_especializacion?: string;

  @ApiProperty({
    description: 'Indica si la persona está activa',
    example: true,
  })
  activo: boolean;

  @ApiProperty({
    description: 'Nodos del organigrama activo donde la persona está asignada',
    type: [PersonaCargoDto],
  })
  cargos: PersonaCargoDto[];
}
