import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { PersonType } from '../enums/person-type.enums';
import { ISocialNetworks } from '../entities/person.entity';

export class CreatePersonDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstname: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastname: string;

  @IsString()
  @IsNotEmpty()
  // @Matches(/^\\d{2}-\\d{8}-\\d{1}$/, {
  //   message: 'El CUIL debe tener el formato XX-XXXXXXXX-X.',
  // })
  cuil: string;

  @IsEnum(PersonType, {
    message: `El tipo de persona debe ser uno de los siguientes valores: ${Object.values(PersonType).join(', ')}`,
  })
  @IsNotEmpty()
  person_type: PersonType;

  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico debe ser válido.' })
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone_number?: string;

  @IsOptional()
  @IsString() // @IsUrl() si siempre es una URL completa
  @MaxLength(255)
  photo_url?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  social_networks?: ISocialNetworks;

  @ValidateIf((o) => o.person_type === PersonType.OFFICIAL)
  @IsNotEmpty({
    message: 'El título del puesto es requerido para un funcionario.',
  })
  @IsString()
  @MaxLength(150)
  job_title_text?: string;

  @ValidateIf((o) => o.person_type === PersonType.ASSESSOR)
  @IsNotEmpty({
    message: 'El área de especialización es requerida para un asesor.',
  })
  @IsString()
  @MaxLength(150)
  expertise_area?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;
}
