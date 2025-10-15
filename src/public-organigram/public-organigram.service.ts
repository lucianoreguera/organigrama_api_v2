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
   * Obtiene el nivel "secretaría"
   */
  private async getSecretariaLevel(): Promise<Level> {
    const level = await this.levelModel.findOne({ name: 'secretaría' }).lean();

    if (!level) {
      throw new NotFoundException('No se encontró el nivel "secretaría"');
    }

    return level;
  }

  /**
   * Lista todas las secretarías de la versión activa
   */
  async getAllSecretarias(): Promise<SecretariaResponseDto[]> {
    this.logger.log('Obteniendo todas las secretarías');

    const activeVersion = await this.getActiveVersion();
    const secretariaLevel = await this.getSecretariaLevel();

    const secretarias = await this.departmentNodeModel
      .find({
        version: activeVersion._id,
        level_id: secretariaLevel._id,
      })
      .populate('department', 'name code objective')
      .sort({ 'department.name': 1 })
      .lean();

    this.logger.log(`Se encontraron ${secretarias.length} secretarías`);

    return secretarias.map((node) => ({
      id: (node._id as Types.ObjectId).toString(),
      nombre: (node.department as any).name,
      codigo: (node.department as any).code || undefined,
      objetivo: (node.department as any).objective || undefined,
    }));
  }

  /**
   * Obtiene todos los descendientes de una secretaría de forma plana
   */
  async getSecretariaChildren(
    secretariaId: string,
  ): Promise<DepartmentFlatResponseDto[]> {
    this.logger.log(
      `Obteniendo todos los hijos de la secretaría ${secretariaId}`,
    );

    // Validar que el nodo existe y es una secretaría
    const secretariaNode = await this.departmentNodeModel
      .findById(secretariaId)
      .populate('level_id', 'name')
      .lean();

    if (!secretariaNode) {
      throw new NotFoundException(
        `No se encontró el nodo con ID ${secretariaId}`,
      );
    }

    const levelName = (secretariaNode.level_id as any)?.name?.toLowerCase();
    if (levelName !== 'secretaría') {
      throw new NotFoundException(
        `El nodo ${secretariaId} no corresponde a una secretaría`,
      );
    }

    // Obtener todos los descendientes de forma recursiva
    const descendants = await this.getAllDescendants(
      secretariaId,
      secretariaNode.version,
    );

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
