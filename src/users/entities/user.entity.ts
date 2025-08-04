import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  keycloakId: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ unique: true })
  email: string;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop([String])
  roles: string[];

  @Prop([String])
  realmRoles: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLogin?: Date;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: Object, default: {} })
  preferences: Record<string, any>;

  // Campos adicionales específicos de tu aplicación
  @Prop()
  department?: string;

  @Prop()
  position?: string;

  @Prop()
  phone?: string;

  @Prop()
  profilePicture?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Índices para mejorar performance
UserSchema.index({ keycloakId: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ isActive: 1 });
