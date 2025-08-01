import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PersonType } from '../enums/person-type.enums';

export interface ISocialNetworks {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
}

@Schema({ timestamps: true })
export class Person extends Document {
  @Prop({
    required: true,
    set: (value: string) => value.trim().toLowerCase(),
  })
  firstname: string;

  @Prop({
    required: true,
    index: true,
    set: (value: string) => value.trim().toLowerCase(),
  })
  lastname: string;

  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  cuil: string;

  @Prop({
    required: true,
    enum: Object.values(PersonType),
  })
  person_type: PersonType; // OFFICIAL o ASSESSOR

  @Prop()
  phone_number?: string;

  @Prop({
    unique: true,
    sparse: true,
    set: (value?: string) => (value ? value.trim().toLowerCase() : value),
  })
  email?: string;

  @Prop()
  photo_url?: string;

  @Prop({
    set: (value?: string) => (value ? value.trim().toLowerCase() : value),
  })
  bio?: string;

  @Prop({
    type: Object,
  })
  social_networks?: ISocialNetworks;

  @Prop({
    set: (value?: string) => (value ? value.trim().toLowerCase() : value),
  })
  job_title_text?: string; // Para OFFICIAL: Título del puesto (ej: "Secretario de Hacienda")

  @Prop({
    set: (value?: string) => (value ? value.trim().toLowerCase() : value),
  })
  expertise_area?: string; // Para ASSESSOR: Área de especialización (ej: "Legal", "Contable")

  @Prop({
    default: true,
  })
  is_active: boolean;
}

export const PersonSchema = SchemaFactory.createForClass(Person);
