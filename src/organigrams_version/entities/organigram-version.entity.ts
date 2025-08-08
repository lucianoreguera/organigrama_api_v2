import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class OrganigramVersion extends Document {
  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  version_tag: string;

  @Prop({
    required: true,
    type: Date,
  })
  effective_date: Date;

  @Prop()
  description?: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  created_by?: Types.ObjectId;

  @Prop({
    default: false,
    index: true, // Para consultas de versión activa
  })
  is_active: boolean;

  @Prop({
    type: Object,
    default: {},
  })
  raw_input_tree?: object;
}

export const OrganigramVersionSchema =
  SchemaFactory.createForClass(OrganigramVersion);

// Índice compuesto para encontrar la versión activa rápidamente
OrganigramVersionSchema.index({ is_active: 1, effective_date: -1 });

// Middleware para asegurar que solo haya una versión activa
OrganigramVersionSchema.pre('save', async function (next) {
  if (this.is_active && this.isModified('is_active')) {
    // Desactivar todas las otras versiones antes de activar esta
    await (this.constructor as any).updateMany(
      { _id: { $ne: this._id }, is_active: true },
      { $set: { is_active: false } },
    );
  }
  next();
});
