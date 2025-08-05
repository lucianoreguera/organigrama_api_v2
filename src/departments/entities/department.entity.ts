import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

interface GeoJsonPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitud, latitud]
}

@Schema({ timestamps: true })
export class Department extends Document {
  @Prop({
    required: true,
    unique: true,
    index: true,
    set: (value: string) => value.trim().toLowerCase(),
  })
  name: string;

  @Prop({
    set: (value?: string) => (value ? value.trim().toLowerCase() : value),
  })
  objective?: string;

  @Prop({
    set: (value?: string) => (value ? value.trim().toLowerCase() : value),
  })
  code?: string;

  @Prop({
    type: Object,
  })
  geo_point?: GeoJsonPoint;

  @Prop()
  address_text?: string;

  @Prop({
    default: true,
  })
  is_active: boolean;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);

DepartmentSchema.index({ geo_point: '2dsphere' });
