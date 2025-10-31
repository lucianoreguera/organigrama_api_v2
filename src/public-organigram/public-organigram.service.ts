import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrganigramVersion } from '../organigrams_version/entities/organigram-version.entity';
import { DepartmentNode } from '../organigrams_version/entities/department-node.entity';
import { Level } from '../levels/entities/level.entity';
import {
  SecretariaResponseDto,
  DepartmentFlatResponseDto,
} from './dto/public-organigram.dto';

@Injectable()
export class PublicOrganigramService {
  private readonly logger = new Logger(PublicOrganigramService.name);

  constructor(
    @InjectModel(OrganigramVersion.name)
    private readonly organigramVersionModel: Model<OrganigramVersion>,
    @InjectModel(DepartmentNode.name)
    private readonly departmentNodeModel: Model<DepartmentNode>,
    @InjectModel(Level.name)
    private readonly levelModel: Model<Level>,
  ) {}

  /**
   * Obtiene la versión activa del organigrama
   */
  private async getActiveVersion(): Promise<OrganigramVersion> {
    const activeVersion = await this.organigramVersionModel
      .findOne({ is_active: true })
      .lean();

    if (!activeVersion) {
      throw new NotFoundException('No hay una versión activa del organigrama');
    }

    return activeVersion;
  }

  /**
   * Obtiene los niveles 1 y 2 (secretaría)
   * Como level se guarda como string, buscamos por los valores string '1' y '2'
   */
  private async getSecretariaLevels(): Promise<Level[]> {
    const levels = await this.levelModel
      .find({
        level: { $in: ['1', '2'] },
      })
      .lean();

    if (!levels || levels.length === 0) {
      throw new NotFoundException('No se encontraron los niveles 1 y 2');
    }

    return levels;
  }

  /**
   * Lista todas las secretarías de la versión activa (niveles 1 y 2)
   */
  async getAllSecretarias(): Promise<SecretariaResponseDto[]> {
    this.logger.log('Obteniendo todas las secretarías (niveles 1 y 2)');

    const activeVersion = await this.getActiveVersion();
    const secretariaLevels = await this.getSecretariaLevels();
    const levelIds = secretariaLevels.map((level) => level._id);

    const secretarias = await this.departmentNodeModel
      .find({
        version: activeVersion._id,
        level_id: { $in: levelIds },
      })
      .populate('department', 'name code objective')
      .sort({ depth: 1, 'department.name': 1 })
      .lean();

    this.logger.log(`Se encontraron ${secretarias.length} secretarías`);

    return secretarias.map((node) => ({
      id: (node._id as Types.ObjectId).toString(),
      nombre: (node.department as any).name,
      codigo: (node.department as any).code || undefined,
      objetivo: (node.department as any).objetivo || undefined,
    }));
  }

  /**
   * Obtiene todos los descendientes de una secretaría de forma plana
   * Si el nodo no tiene hijos (es nivel 1 sin descendientes), devuelve el mismo nodo
   */
  async getSecretariaChildren(
    secretariaId: string,
  ): Promise<DepartmentFlatResponseDto[]> {
    this.logger.log(
      `Obteniendo todos los hijos de la secretaría ${secretariaId}`,
    );

    // Validar que el nodo existe y es de nivel 1 o 2
    const secretariaNode = await this.departmentNodeModel
      .findById(secretariaId)
      .populate('level_id', 'name level')
      .populate('department', 'name code objective')
      .lean();

    if (!secretariaNode) {
      throw new NotFoundException(
        `No se encontró el nodo con ID ${secretariaId}`,
      );
    }

    // Convertir level a string para comparación (por si acaso viene como número)
    const levelValue = String((secretariaNode.level_id as any)?.level);

    if (!['1', '2'].includes(levelValue)) {
      throw new NotFoundException(
        `El nodo ${secretariaId} no corresponde a un nivel 1 o 2 (nivel actual: ${levelValue})`,
      );
    }

    // Obtener todos los descendientes de forma recursiva
    const descendants = await this.getAllDescendants(
      secretariaId,
      secretariaNode.version,
    );

    // Si no tiene descendientes, devolver el mismo nodo
    if (descendants.length === 0) {
      this.logger.log(
        `El nodo ${secretariaId} no tiene hijos, devolviendo el mismo nodo`,
      );

      return [
        {
          id: (secretariaNode._id as Types.ObjectId).toString(),
          nombre: (secretariaNode.department as any).name,
          codigo: (secretariaNode.department as any).code || undefined,
          nivel: (secretariaNode.level_id as any)?.name || '',
          path_jerarquico: secretariaNode.hierarchical_path || undefined,
          profundidad: secretariaNode.depth || 0,
        },
      ];
    }

    this.logger.log(
      `Se encontraron ${descendants.length} descendientes de la secretaría`,
    );

    return descendants
      .sort((a, b) => {
        // Ordenar por profundidad y luego por nombre
        if (a.depth !== b.depth) {
          return a.depth - b.depth;
        }
        return ((a.department as any).name || '').localeCompare(
          (b.department as any).name || '',
        );
      })
      .map((node) => ({
        id: (node._id as Types.ObjectId).toString(),
        nombre: (node.department as any).name,
        codigo: (node.department as any).code || undefined,
        nivel: (node.level_id as any)?.name || '',
        path_jerarquico: node.hierarchical_path || undefined,
        profundidad: node.depth || 0,
      }));
  }

  /**
   * Método recursivo para obtener todos los descendientes de un nodo
   */
  private async getAllDescendants(
    nodeId: string,
    versionId: Types.ObjectId,
  ): Promise<any[]> {
    const directChildren = await this.departmentNodeModel
      .find({
        version: versionId,
        parent_node: new Types.ObjectId(nodeId),
      })
      .populate('department', 'name code objective')
      .populate('level_id', 'name')
      .lean();

    let allDescendants = [...directChildren];

    // Recursivamente obtener los descendientes de cada hijo
    for (const child of directChildren) {
      const childDescendants = await this.getAllDescendants(
        (child._id as Types.ObjectId).toString(),
        versionId,
      );
      allDescendants = allDescendants.concat(childDescendants);
    }

    return allDescendants;
  }
}
