import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CreateOrganigramVersionDto,
  DepartmentNodeInputDto,
  OrganigramNodeDto,
  OrganigramStructureResponseDto,
  NodeDescendantsResponseDto,
} from './dto';
import { OrganigramVersion } from './entities/organigram-version.entity';
import { DepartmentNode } from './entities/department-node.entity';
import { User } from '../users/entities/user.entity';
import { DepartmentsService } from '../departments/departments.service';
import { LevelsService } from '../levels/levels.service';
import { handleExceptions } from '../common/helpers/handle-exception';

interface FrontendToMongoIdMap {
  [frontendId: string]: Types.ObjectId;
}

@Injectable()
export class OrganigramVersionsService {
  private readonly logger = new Logger(OrganigramVersionsService.name);

  constructor(
    @InjectModel(OrganigramVersion.name)
    private readonly organigramVersionModel: Model<OrganigramVersion>,
    @InjectModel(DepartmentNode.name)
    private readonly departmentNodeModel: Model<DepartmentNode>,
    private readonly departmentsService: DepartmentsService,
    private readonly levelsService: LevelsService,
  ) {}

  async processAndCreateVersion(
    dto: CreateOrganigramVersionDto,
    requestingUser?: any, // Opcional por ahora hasta que integres Keycloak
  ): Promise<OrganigramVersion> {
    this.logger.log(
      `Iniciando procesamiento para nueva versión del organigrama: ${dto.version_tag}`,
    );

    try {
      // 1. Crear la nueva versión (esto desactivará automáticamente las anteriores por el middleware)
      const newVersionData = {
        version_tag: dto.version_tag,
        effective_date: new Date(dto.effective_date),
        description: dto.description,
        // created_by: requestingUser ? new Types.ObjectId(requestingUser._id) : undefined, // Comentado por ahora
        is_active: true,
        raw_input_tree: this.cleanObjectForSerialization({
          nodes: dto.nodes,
          metadata: {
            created_from_dto: true,
            node_count: dto.nodes?.length || 0,
            timestamp: new Date().toISOString(),
          },
        }),
      };

      const createdVersion =
        await this.organigramVersionModel.create(newVersionData);

      this.logger.log(`Nueva versión creada: ${createdVersion._id}`);

      // 2. Procesar nodos del árbol
      const frontendIdToMongoIdMap: FrontendToMongoIdMap = {};
      await this.processNodeRecursive(
        dto.nodes,
        createdVersion._id as Types.ObjectId,
        null,
        frontendIdToMongoIdMap,
      );

      this.logger.log('Procesamiento completado exitosamente.');

      return createdVersion;
    } catch (error) {
      this.logger.error(
        `Error durante la creación: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Error no controlado al procesar la nueva versión del organigrama: ${error.message}`,
      );
    }
  }

  async getAllVersions(
    sortBy: string = 'effective_date',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<
    Array<{
      _id: string;
      version_tag: string;
      effective_date: Date;
      isActive: boolean;
    }>
  > {
    // Validar campos de ordenamiento permitidos
    const allowedSortFields = ['effective_date', 'version_tag', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'effective_date';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const versions = await this.organigramVersionModel
      .find()
      .select('_id version_tag effective_date is_active createdAt')
      .sort({ [sortField]: sortDirection })
      .lean()
      .exec();

    return versions.map((version) => ({
      _id: version._id.toString(),
      version_tag: version.version_tag,
      effective_date: version.effective_date,
      isActive: version.is_active || false,
    }));
  }

  private async processNodeRecursive(
    nodes: DepartmentNodeInputDto[],
    versionId: Types.ObjectId,
    parentMongoId: Types.ObjectId | null,
    frontendIdToMongoIdMap: FrontendToMongoIdMap,
  ): Promise<void> {
    for (const nodeInput of nodes) {
      // Buscar Department base (por ahora solo crear siempre)
      // TODO: Implementar findByName y findByCode en DepartmentsService
      let departmentRecord: any = null;

      try {
        departmentRecord = await this.departmentsService.findByName(
          nodeInput.department_data.name,
        );
      } catch (error) {
        if (nodeInput.department_data.code) {
          try {
            departmentRecord = await this.departmentsService.findByCode(
              nodeInput.department_data.code,
            );
          } catch (codeError) {
            departmentRecord = null;
          }
        }
      }

      if (!departmentRecord) {
        this.logger.log(
          `Creando departamento: ${nodeInput.department_data.name}`,
        );
        const createdDepartment = await this.departmentsService.create({
          name: nodeInput.department_data.name,
          code: nodeInput.department_data.code,
          objective: nodeInput.department_data.objective,
          is_active: true,
        });

        if (!createdDepartment) {
          throw new InternalServerErrorException(
            `No se pudo crear el departamento: ${nodeInput.department_data.name}`,
          );
        }

        departmentRecord = createdDepartment;
      }

      // Validar level_id
      const levelRecord = await this.levelsService.findOne(nodeInput.level_id);
      if (!levelRecord) {
        throw new BadRequestException(
          `Nivel con ID '${nodeInput.level_id}' no encontrado para el nodo '${nodeInput.department_data.name}'.`,
        );
      }

      // Crear el DepartmentNode
      const nodeDataToCreate = {
        version: versionId,
        department: new Types.ObjectId(departmentRecord._id as string),
        level_id: new Types.ObjectId(levelRecord._id as string),
        parent_node: parentMongoId,
        ui_hints: nodeInput.ui_hints || {},
        // path y depth se calculan automáticamente en el middleware
      };

      const createdNodes = await this.departmentNodeModel.create([
        nodeDataToCreate,
      ]);
      const newDepartmentNode = createdNodes[0];

      // Mapear el ID del frontend al ID de MongoDB
      frontendIdToMongoIdMap[nodeInput.frontend_id] =
        newDepartmentNode._id as Types.ObjectId;

      this.logger.log(
        `DepartmentNode creado: ${newDepartmentNode._id} para ${nodeInput.department_data.name}`,
      );

      // Procesar hijos recursivamente
      if (nodeInput.children && nodeInput.children.length > 0) {
        await this.processNodeRecursive(
          nodeInput.children,
          versionId,
          newDepartmentNode._id as Types.ObjectId,
          frontendIdToMongoIdMap,
        );
      }
    }
  }

  private cleanObjectForSerialization(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.cleanObjectForSerialization(item));
    }

    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (!key.startsWith('_') && typeof value !== 'function') {
          cleaned[key] = this.cleanObjectForSerialization(value);
        }
      }
      return cleaned;
    }

    return obj;
  }

  async getActiveOrganigramStructure(): Promise<OrganigramStructureResponseDto> {
    this.logger.log('Obteniendo estructura de organigrama activo');

    const activeVersion = await this.organigramVersionModel.findOne({
      is_active: true,
    });

    if (!activeVersion) {
      throw new NotFoundException(
        'No se encontró versión activa del organigrama',
      );
    }

    return this.getOrganigramStructureByVersion(
      (activeVersion._id as Types.ObjectId).toString(),
    );
  }

  async getActiveVersion(): Promise<OrganigramVersion> {
    const activeVersion = await this.organigramVersionModel.findOne({
      is_active: true,
    });

    if (!activeVersion) {
      throw new NotFoundException(
        'No se encontró versión activa del organigrama',
      );
    }

    return activeVersion;
  }

  async getOrganigramStructureByVersion(
    versionId: string,
  ): Promise<OrganigramStructureResponseDto> {
    this.logger.log(
      `Obteniendo estructura de organigrama para versión: ${versionId}`,
    );

    try {
      // Obtener la versión
      const version = await this.organigramVersionModel.findById(versionId);
      if (!version) {
        throw new NotFoundException(
          `No se encontró la versión del organigrama con ID: ${versionId}`,
        );
      }

      // Obtener todos los nodos de la versión con populate
      const nodes = await this.departmentNodeModel
        .find({ version: new Types.ObjectId(versionId) })
        .populate('department', 'name code objective')
        .populate('level_id', 'name order')
        .populate('responsible_official', 'firstname lastname person_type')
        .populate('assigned_assessors', 'firstname lastname person_type')
        .sort({ depth: 1, path: 1 }) // Ordenar por profundidad y path
        .lean();

      // Construir la estructura jerárquica
      const hierarchicalNodes = this.buildHierarchicalStructure(nodes);

      return {
        version: {
          id: (version._id as Types.ObjectId).toString(),
          version_tag: version.version_tag,
          effective_date: version.effective_date.toISOString(),
          description: version.description,
          is_active: version.is_active,
          created_at: (version as any).createdAt.toISOString(),
          updated_at: (version as any).updatedAt.toISOString(),
        },
        nodes: hierarchicalNodes,
      };
    } catch (error) {
      this.logger.error(
        `Error obteniendo estructura del organigrama: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Error interno al obtener la estructura del organigrama: ${error.message}`,
      );
    }
  }

  private buildHierarchicalStructure(nodes: any[]): OrganigramNodeDto[] {
    this.logger.debug(
      `Construyendo estructura jerárquica para ${nodes.length} nodos`,
    );

    if (!nodes || nodes.length === 0) {
      this.logger.debug('Array de nodos vacío');
      return [];
    }

    // Crear mapa de nodos por ID para acceso rápido
    const nodeMap = new Map<string, OrganigramNodeDto>();
    const rootNodes: OrganigramNodeDto[] = [];

    this.logger.debug('Transformando nodos...');

    // Transformar todos los nodos al formato de respuesta
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      try {
        this.logger.debug(
          `Procesando nodo ${i}: ${JSON.stringify({
            _id: node._id,
            parent_node: node.parent_node,
            department: node.department ? 'populated' : 'not populated',
            level_id: node.level_id ? 'populated' : 'not populated',
          })}`,
        );

        const transformedNode: OrganigramNodeDto = {
          frontend_id: (node._id as Types.ObjectId).toString(),
          parentId: node.parent_node
            ? (node.parent_node as Types.ObjectId).toString()
            : null,
          department_data: {
            name: (node.department as any)?.name || 'Sin nombre',
            code: (node.department as any)?.code || '',
            objective: (node.department as any)?.objective || '',
          },
          level_id: node.level_id
            ? ((node.level_id as any)?._id as Types.ObjectId)?.toString() || ''
            : '',
          ui_hints: node.ui_hints || {},
          children: [],
        };

        nodeMap.set((node._id as Types.ObjectId).toString(), transformedNode);

        // Si es nodo raíz (sin parent_node)
        if (!node.parent_node) {
          rootNodes.push(transformedNode);
          this.logger.debug(
            `Nodo raíz agregado: ${transformedNode.frontend_id}`,
          );
        }
      } catch (nodeError) {
        this.logger.error(
          `Error procesando nodo ${i}: ${nodeError.message}`,
          JSON.stringify(node, null, 2),
        );
      }
    }

    this.logger.debug(
      `Nodos transformados: ${nodeMap.size}, nodos raíz: ${rootNodes.length}`,
    );

    // Construir relaciones padre-hijo
    for (const node of nodes) {
      if (node.parent_node) {
        const parentKey = (node.parent_node as Types.ObjectId).toString();
        const childKey = (node._id as Types.ObjectId).toString();

        const parent = nodeMap.get(parentKey);
        const child = nodeMap.get(childKey);

        if (parent && child) {
          parent.children.push(child);
          this.logger.debug(`Relación padre-hijo: ${parentKey} -> ${childKey}`);
        } else {
          this.logger.warn(
            `No se pudo crear relación ${parentKey} -> ${childKey}. Parent: ${!!parent}, Child: ${!!child}`,
          );
        }
      }
    }

    this.logger.log(
      `Estructura jerárquica construida: ${rootNodes.length} nodos raíz, ${nodeMap.size} nodos totales`,
    );

    return rootNodes;
  }

  // Consulta de descendientes usando Materialized Path
  // async getDescendantStructureForNode(
  //   nodeId: string,
  // ): Promise<OrganigramNodeDto> {
  //   this.logger.log(
  //     `Obteniendo estructura de descendientes para el nodo: ${nodeId}`,
  //   );

  //   try {
  //     // Primero obtener el nodo raíz
  //     const rootNode = await this.departmentNodeModel
  //       .findById(nodeId)
  //       .populate('department', 'name code objective')
  //       .populate('level_id', 'name order')
  //       .lean();

  //     if (!rootNode) {
  //       throw new NotFoundException(`Nodo con ID ${nodeId} no encontrado.`);
  //     }

  //     // Obtener todos los descendientes usando el path
  //     const descendants = await this.departmentNodeModel
  //       .find({
  //         version: rootNode.version,
  //         path: { $regex: `^${rootNode.path}/` }, // Todos los que empiecen con el path del nodo + /
  //       })
  //       .populate('department', 'name code objective')
  //       .populate('level_id', 'name order')
  //       .sort({ depth: 1, path: 1 })
  //       .lean();

  //     // Combinar el nodo raíz con sus descendientes
  //     const allNodes = [rootNode, ...descendants];

  //     // Construir la estructura jerárquica
  //     const hierarchicalNodes = this.buildHierarchicalStructure(allNodes);

  //     if (!hierarchicalNodes || hierarchicalNodes.length === 0) {
  //       throw new InternalServerErrorException(
  //         `Error al construir la jerarquía para el nodo ${nodeId}`,
  //       );
  //     }

  //     this.logger.log(
  //       `Estructura de descendientes para ${nodeId} construida exitosamente.`,
  //     );

  //     return hierarchicalNodes[0]; // Retornar el nodo raíz con toda su descendencia
  //   } catch (error) {
  //     this.logger.error(
  //       `Error obteniendo descendientes para el nodo ${nodeId}: ${error.message}`,
  //       error.stack,
  //     );

  //     if (
  //       error instanceof NotFoundException ||
  //       error instanceof InternalServerErrorException
  //     ) {
  //       throw error;
  //     }

  //     throw new InternalServerErrorException(
  //       `Error interno al procesar la solicitud de descendientes para el nodo ${nodeId}.`,
  //     );
  //   }
  // }
  async getDescendantStructureForNode(
    nodeId: string,
  ): Promise<OrganigramNodeDto> {
    this.logger.log(
      `Obteniendo estructura de descendientes para el nodo: ${nodeId}`,
    );

    try {
      // Primero obtener el nodo raíz
      const rootNode = await this.departmentNodeModel
        .findById(nodeId)
        .populate('department', 'name code objective')
        .populate('level_id', 'name order')
        .lean();

      if (!rootNode) {
        throw new NotFoundException(`Nodo con ID ${nodeId} no encontrado.`);
      }

      this.logger.debug(`Nodo raíz encontrado para descendientes`);

      // Obtener todos los descendientes usando el path
      const descendants = await this.departmentNodeModel
        .find({
          version: rootNode.version,
          path: { $regex: `^${rootNode.path}/` },
        })
        .populate('department', 'name code objective')
        .populate('level_id', 'name order')
        .sort({ depth: 1, path: 1 })
        .lean();

      this.logger.debug(`Descendientes encontrados: ${descendants.length}`);

      // Construir el nodo raíz manualmente
      const rootNodeFormatted: OrganigramNodeDto = {
        frontend_id: (rootNode._id as Types.ObjectId).toString(),
        parentId: null, // En contexto de descendientes, este es raíz
        department_data: {
          name: (rootNode.department as any)?.name || 'Sin nombre',
          code: (rootNode.department as any)?.code || '',
          objective: (rootNode.department as any)?.objective || '',
        },
        level_id: rootNode.level_id
          ? ((rootNode.level_id as any)?._id as Types.ObjectId)?.toString() ||
            ''
          : '',
        ui_hints: rootNode.ui_hints || {},
        children: [],
      };

      // Si no hay descendientes, devolver solo el nodo raíz
      if (descendants.length === 0) {
        this.logger.log(
          `No hay descendientes para ${nodeId}, devolviendo solo el nodo raíz`,
        );
        return rootNodeFormatted;
      }

      // Crear mapa para construcción de jerarquía
      const nodeMap = new Map<string, OrganigramNodeDto>();
      nodeMap.set(rootNodeFormatted.frontend_id, rootNodeFormatted);

      // Procesar descendientes
      for (const descendant of descendants) {
        const descendantFormatted: OrganigramNodeDto = {
          frontend_id: (descendant._id as Types.ObjectId).toString(),
          parentId: descendant.parent_node
            ? (descendant.parent_node as Types.ObjectId).toString()
            : null,
          department_data: {
            name: (descendant.department as any)?.name || 'Sin nombre',
            code: (descendant.department as any)?.code || '',
            objective: (descendant.department as any)?.objective || '',
          },
          level_id: descendant.level_id
            ? (
                (descendant.level_id as any)?._id as Types.ObjectId
              )?.toString() || ''
            : '',
          ui_hints: descendant.ui_hints || {},
          children: [],
        };

        nodeMap.set(descendantFormatted.frontend_id, descendantFormatted);
      }

      // Construir relaciones padre-hijo
      for (const descendant of descendants) {
        const childKey = (descendant._id as Types.ObjectId).toString();
        const parentKey = descendant.parent_node
          ? (descendant.parent_node as Types.ObjectId).toString()
          : null;

        if (parentKey) {
          const parent = nodeMap.get(parentKey);
          const child = nodeMap.get(childKey);

          if (parent && child) {
            parent.children.push(child);
            this.logger.debug(`Relación creada: ${parentKey} -> ${childKey}`);
          } else {
            this.logger.warn(
              `No se pudo crear relación ${parentKey} -> ${childKey}`,
            );
          }
        }
      }

      this.logger.log(
        `Estructura de descendientes construida exitosamente para ${nodeId}`,
      );
      return rootNodeFormatted;
    } catch (error) {
      this.logger.error(
        `Error obteniendo descendientes para el nodo ${nodeId}: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Error interno al procesar la solicitud de descendientes para el nodo ${nodeId}: ${error.message}`,
      );
    }
  }

  // Métodos adicionales útiles
  async getNodesByLevel(
    versionId: string,
    levelId: string,
  ): Promise<OrganigramNodeDto[]> {
    const nodes = await this.departmentNodeModel
      .find({
        version: new Types.ObjectId(versionId),
        level_id: new Types.ObjectId(levelId),
      })
      .populate('department', 'name code objective')
      .populate('level_id', 'name order')
      .lean();

    return nodes.map((node) => ({
      frontend_id: (node._id as Types.ObjectId).toString(),
      parentId: node.parent_node
        ? (node.parent_node as Types.ObjectId).toString()
        : null,
      department_data: {
        name: (node.department as any).name,
        code: (node.department as any).code || '',
        objective: (node.department as any).objective || '',
      },
      level_id: node.level_id
        ? ((node.level_id as any)._id as Types.ObjectId).toString()
        : '',
      ui_hints: node.ui_hints || {},
      children: [],
    }));
  }

  async getDirectChildren(nodeId: string): Promise<OrganigramNodeDto[]> {
    const children = await this.departmentNodeModel
      .find({ parent_node: new Types.ObjectId(nodeId) })
      .populate('department', 'name code objective')
      .populate('level_id', 'name order')
      .sort({ 'department.name': 1 })
      .lean();

    return children.map((node) => ({
      frontend_id: (node._id as Types.ObjectId).toString(),
      parentId: node.parent_node
        ? (node.parent_node as Types.ObjectId).toString()
        : null,
      department_data: {
        name: (node.department as any).name,
        code: (node.department as any).code || '',
        objective: (node.department as any).objective || '',
      },
      level_id: node.level_id
        ? ((node.level_id as any)._id as Types.ObjectId).toString()
        : '',
      ui_hints: node.ui_hints || {},
      children: [],
    }));
  }

  async deactivateVersion(versionId: string): Promise<OrganigramVersion> {
    const version = await this.organigramVersionModel.findByIdAndUpdate(
      versionId,
      { is_active: false },
      { new: true },
    );

    if (!version) {
      throw new NotFoundException(`Versión con ID ${versionId} no encontrada`);
    }

    return version;
  }

  async activateVersion(versionId: string): Promise<OrganigramVersion> {
    try {
      // Desactivar todas las versiones
      await this.organigramVersionModel.updateMany(
        { is_active: true },
        { is_active: false },
      );

      // Activar la versión solicitada
      const version = await this.organigramVersionModel.findByIdAndUpdate(
        versionId,
        { is_active: true },
        { new: true },
      );

      if (!version) {
        throw new NotFoundException(
          `Versión con ID ${versionId} no encontrada`,
        );
      }

      return version;
    } catch (error) {
      this.logger.error(
        `Error activando versión ${versionId}: ${error.message}`,
      );
      throw error;
    }
  }
}
