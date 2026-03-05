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

  // NUEVO: Path jerárquico con nombres legibles
  @Prop({
    type: String,
    index: true,
  })
  hierarchical_path?: string;

  // Profundidad del nodo (0 = raíz, 1 = hijo directo, etc.)
  @Prop({
    type: Number,
    default: 0,
    index: true,
  })
  depth: number;

  // Funcionario responsable
  @Prop({
    type: Types.ObjectId,
    ref: 'Person',
    default: null,
  })
  responsible_official?: Types.ObjectId | null;

  // Asesores asignados
  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Person' }],
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

// Índices estratégicos
DepartmentNodeSchema.index({ version: 1, parent_node: 1 });
DepartmentNodeSchema.index({ version: 1, path: 1 });
DepartmentNodeSchema.index({ version: 1, depth: 1 });
DepartmentNodeSchema.index({ version: 1, hierarchical_path: 1 }); // NUEVO
DepartmentNodeSchema.index({ version: 1, department: 1 }, { unique: true });

// Middleware mejorado para calcular paths
// DepartmentNodeSchema.pre('save', async function (next) {
//   if (this.isNew || this.isModified('parent_node')) {
//     if (this.parent_node) {
//       // Buscar el nodo padre
//       const parentNode = await (this.constructor as any)
//         .findById(this.parent_node)
//         .populate('department', 'name');

//       if (parentNode) {
//         this.path = `${parentNode.path || ''}/${this._id}`;
//         this.depth = (parentNode.depth || 0) + 1;

//         // Construir hierarchical_path con nombres
//         const currentDept = await this.model('Department').findById(
//           this.department,
//         );
//         if (currentDept && parentNode.hierarchical_path) {
//           this.hierarchical_path = `${parentNode.hierarchical_path}/${currentDept.name}`;
//         } else if (currentDept) {
//           this.hierarchical_path = currentDept.name;
//         }
//       } else {
//         throw new Error('Parent node not found');
//       }
//     } else {
//       // Es un nodo raíz
//       this.path = `/${this._id}`;
//       this.depth = 0;

//       // Para nodos raíz, el hierarchical_path es solo el nombre del departamento
//       const currentDept = await this.model('Department').findById(
//         this.department,
//       );
//       if (currentDept) {
//         this.hierarchical_path = currentDept.name;
//       }
//     }
//   }
//   next();
// });
