import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Level extends Document {
  @Prop({
    required: true,
    unique: true,
    index: true,
    set: (value: string) => value.trim().toLowerCase(),
  })
  name: string;

  @Prop({
    required: false,
    set: (value?: string) => (value ? value.trim().toLowerCase() : value),
  })
  description?: string;
}

export const LevelSchema = SchemaFactory.createForClass(Level);
