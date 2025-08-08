import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class DepartmentNode extends Document {
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'OrganigramVersion',
    index: true,
  })
  version: Types.ObjectId;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Department',
    index: true,
  })
  department: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Level',
  })
  level_id?: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'DepartmentNode',
    default: null,
  })
  parent_node?: Types.ObjectId | null;

  // Materialized Path para consultas recursivas eficientes
  @Prop({
    type: String,
    index: true,
  })
  path?: string;

  // Profundidad del nodo (0 = raíz, 1 = hijo directo, etc.)
  @Prop({
    type: Number,
    default: 0,
    index: true,
  })
  depth: number;

  // Funcionario responsable (se asigna posteriormente)
  @Prop({
    type: Types.ObjectId,
    ref: 'Person', // Referencia a Person con person_type = OFFICIAL
    default: null,
  })
  responsible_official?: Types.ObjectId | null;

  // Asesores asignados (se asignan posteriormente)
  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Person' }], // Referencias a Person con person_type = ASSESSOR
    default: [],
  })
  assigned_assessors?: Types.ObjectId[];

  // Información de UI del frontend
  @Prop({
    type: Object,
    default: {},
  })
  ui_hints?: Record<string, any>;
}

export const DepartmentNodeSchema =
  SchemaFactory.createForClass(DepartmentNode);

// Índices estratégicos para consultas de performance
DepartmentNodeSchema.index({ version: 1, parent_node: 1 }); // Hijos directos
DepartmentNodeSchema.index({ version: 1, path: 1 }); // Descendientes por path
DepartmentNodeSchema.index({ version: 1, depth: 1 }); // Consultas por nivel
DepartmentNodeSchema.index({ version: 1, department: 1 }, { unique: true }); // Un departamento por versión

// Middleware para calcular automáticamente path y depth
DepartmentNodeSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('parent_node')) {
    if (this.parent_node) {
      // Buscar el nodo padre para calcular path y depth
      const parentNode = await (this.constructor as any).findById(
        this.parent_node,
      );
      if (parentNode) {
        this.path = `${parentNode.path || ''}/${this._id}`;
        this.depth = (parentNode.depth || 0) + 1;
      } else {
        throw new Error('Parent node not found');
      }
    } else {
      // Es un nodo raíz
      this.path = `/${this._id}`;
      this.depth = 0;
    }
  }
  next();
});

// Middleware para actualizar paths de hijos cuando cambia un nodo
DepartmentNodeSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as any;

  if (update.$set && update.$set.parent_node !== undefined) {
    // Si se está cambiando el parent_node, necesitamos recalcular paths
    const docId = this.getQuery()._id;

    if (update.$set.parent_node) {
      const parentNode = await this.model.findById(update.$set.parent_node);
      if (parentNode) {
        update.$set.path = `${parentNode.path || ''}/${docId}`;
        update.$set.depth = (parentNode.depth || 0) + 1;
      }
    } else {
      // Se está convirtiendo en nodo raíz
      update.$set.path = `/${docId}`;
      update.$set.depth = 0;
    }
  }

  next();
});
