import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUrl, MaxLength } from 'class-validator';

export class SocialNetworksDto {
  @ApiPropertyOptional({
    description: 'URL del perfil de Facebook',
    example: 'https://facebook.com/johndoe',
    format: 'uri',
  })
  @IsOptional()
  @IsUrl({}, { message: 'La URL de Facebook debe ser válida' })
  @MaxLength(255)
  facebook?: string;

  @ApiPropertyOptional({
    description: 'URL del perfil de Twitter/X',
    example: 'https://twitter.com/johndoe',
    format: 'uri',
  })
  @IsOptional()
  @IsUrl({}, { message: 'La URL de Twitter debe ser válida' })
  @MaxLength(255)
  twitter?: string;

  @ApiPropertyOptional({
    description: 'URL del perfil de LinkedIn',
    example: 'https://linkedin.com/in/johndoe',
    format: 'uri',
  })
  @IsOptional()
  @IsUrl({}, { message: 'La URL de LinkedIn debe ser válida' })
  @MaxLength(255)
  linkedin?: string;

  @ApiPropertyOptional({
    description: 'URL del perfil de Instagram',
    example: 'https://instagram.com/johndoe',
    format: 'uri',
  })
  @IsOptional()
  @IsUrl({}, { message: 'La URL de Instagram debe ser válida' })
  @MaxLength(255)
  instagram?: string;
}
