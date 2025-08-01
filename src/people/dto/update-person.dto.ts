import { PartialType } from '@nestjs/mapped-types';
import { CreatePersonDto } from './create-person.dto';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { PersonType } from '../enums/person-type.enums';

export class UpdatePersonDto extends PartialType(CreatePersonDto) {
  @IsOptional()
  @IsEnum(PersonType, {
    message: `El tipo de persona debe ser uno de los siguientes valores: ${Object.values(PersonType).join(', ')}`,
  })
  person_type?: PersonType; // Permitir cambiar el tipo si es necesario

  // Si se actualiza person_type, los campos condicionales también podrían necesitar ser validados.
  // Esto puede volverse complejo con PartialType. A menudo, las actualizaciones de campos
  // que dependen de un "tipo" se manejan con lógica de servicio más explícita o DTOs separados.
  // Por ahora, mantenemos la validación condicional del CreatePersonDto que PartialType hereda.

  @ValidateIf(
    (o) =>
      o.person_type === PersonType.OFFICIAL ||
      (o.person_type === undefined && o.job_title_text !== undefined),
  ) // Validar si es OFFICIAL o si se está intentando actualizar este campo
  @IsOptional() // Es opcional en el update
  @IsNotEmpty({
    message:
      'El título del puesto no puede estar vacío si se provee para un funcionario.',
  })
  @IsString()
  @MaxLength(150)
  job_title_text?: string;

  @ValidateIf(
    (o) =>
      o.person_type === PersonType.ASSESSOR ||
      (o.person_type === undefined && o.expertise_area !== undefined),
  ) // Validar si es ASSESSOR o si se está intentando actualizar este campo
  @IsOptional() // Es opcional en el update
  @IsNotEmpty({
    message:
      'El área de especialización no puede estar vacía si se provee para un asesor.',
  })
  @IsString()
  @MaxLength(150)
  expertise_area?: string;
}
