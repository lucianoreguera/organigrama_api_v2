import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class App extends Document {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true })
  apiKey!: string;

  @Prop({ required: true, default: true })
  activo!: boolean;
}

export const AppSchema = SchemaFactory.createForClass(App);
