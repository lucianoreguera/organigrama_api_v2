import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import {
  CreateOrganigramVersionDto,
  DepartmentNodeInputDto,
  OrganigramNodeDto,
  OrganigramStructureResponseDto,
  AssignAssessorsDto,
  AssignResponsibleOfficialDto,
} from './dto';
import { OrganigramVersion } from './entities/organigram-version.entity';
import { DepartmentNode } from './entities/department-node.entity';
import { DepartmentsService } from '../departments/departments.service';
import { LevelsService } from '../levels/levels.service';
import { PeopleService } from '../people/people.service';
import { CreateDepartmentDto } from '../departments/dto/create-department.dto';
import { FileUploadService } from '../common/services/file-upload.service';
import { CacheWarmingService } from '../public-organigram/cache-warming.service';

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
    @InjectConnection()
    private readonly connection: Connection,
    private readonly departmentsService: DepartmentsService,
    private readonly levelsService: LevelsService,
    private readonly peopleService: PeopleService,
    private readonly fileUploadService: FileUploadService,
    private readonly cacheWarmingService: CacheWarmingService,
  ) {}

  async processAndCreateVersion(
    dto: CreateOrganigramVersionDto,
    decree_file?: Express.Multer.File,
    requestingUser?: any,
  ): Promise<OrganigramVersion> {
    this.logger.log(
      `Iniciando procesamiento para nueva versión del organigrama: ${dto.version_tag}`,
    );

    // Iniciar sesión de MongoDB para transacción
    const session = await this.connection.startSession();

    try {
      let decree_file_url: string | undefined = undefined;

      // 1. Subir archivo de decreto ANTES de la transacción
      // (MongoDB no puede hacer rollback de operaciones externas como archivos)
      if (decree_file) {
        try {
          this.logger.log(
            `Subiendo archivo de decreto para versión: ${dto.version_tag}`,
          );

          // Generar nombre único para el archivo de decreto basado en la versión
          const fileName = `decreto-${dto.version_tag.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

          decree_file_url = await this.fileUploadService.uploadFile(
            decree_file,
            fileName,
          );

          this.logger.log(`Decreto subido exitosamente: ${decree_file_url}`);
        } catch (uploadError) {
          this.logger.error(
            `Error al subir el archivo de decreto: ${uploadError.message}`,
            uploadError.stack,
          );
          // Fallar antes de iniciar la transacción si hay error en el decreto
          throw new InternalServerErrorException(
            `Error al procesar el archivo de decreto: ${uploadError.message}`,
          );
        }
      }

      // 2. Ejecutar todas las operaciones de BD dentro de una transacción
      let createdVersion: OrganigramVersion;

      await session.withTransaction(async () => {
        // 2a. Crear la nueva versión dentro de la transacción
        const newVersionData = {
          version_tag: dto.version_tag,
          effective_date: new Date(dto.effective_date),
          description: dto.description,
          decree_file_url: decree_file_url,
          is_active: true,
          raw_input_tree: this.cleanObjectForSerialization({
            nodes: dto.nodes,
            metadata: {
              created_from_dto: true,
              node_count: dto.nodes?.length || 0,
              timestamp: new Date().toISOString(),
              has_decree_file: !!decree_file_url,
            },
          }),
        };

        const versions = await this.organigramVersionModel.create(
          [newVersionData],
          { session },
        );
        createdVersion = versions[0];
        this.logger.log(`Nueva versión creada: ${createdVersion._id}`);

        // 2b. Procesar nodos del árbol dentro de la transacción
        const frontendIdToMongoIdMap: FrontendToMongoIdMap = {};
        await this.processNodeRecursiveWithPeople(
          dto.nodes,
          createdVersion._id as Types.ObjectId,
          null,
          frontendIdToMongoIdMap,
          '',
          session,
        );

        this.logger.log(
          'Todos los nodos procesados exitosamente dentro de la transacción.',
        );
      });

      // 3. Transacción completada exitosamente
      await session.endSession();
      this.logger.log('Transacción completada. Procesamiento exitoso.');
      return createdVersion!;
    } catch (error) {
      // La transacción se hace rollback automáticamente en caso de error
      await session.endSession();

      this.logger.error(
        `Error durante la creación: ${error.message}`,
        error.stack,
      );

      // Si hubo error después de subir el decreto, quedará huérfano
      if (decree_file) {
        this.logger.warn(
          'Se subió un archivo de decreto pero falló la transacción. El archivo quedará huérfano (considera implementar limpieza de archivos huérfanos).',
        );
      }

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
      decree_file_url?: string;
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
      .select(
        '_id version_tag effective_date is_active decree_file_url createdAt',
      )
      .sort({ [sortField]: sortDirection })
      .lean()
      .exec();

    return versions.map((version) => ({
      _id: version._id.toString(),
      version_tag: version.version_tag,
      effective_date: version.effective_date,
      isActive: version.is_active || false,
      decree_file_url: version.decree_file_url || undefined, // Convertir null a undefined
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

      // Obtener todos los nodos de la versión con populate COMPLETO incluyendo level
      const nodes = await this.departmentNodeModel
        .find({ version: new Types.ObjectId(versionId) })
        .populate('department', 'name code objective address_text')
        .populate('level_id', 'name level') // *** INCLUIR 'level' EN EL POPULATE ***
        .populate(
          'responsible_official',
          'firstname lastname person_type photo_url job_title_text',
        )
        .populate(
          'assigned_assessors',
          'firstname lastname person_type photo_url expertise_area',
        )
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
          decree_file_url: version.decree_file_url || undefined,
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
            address_text: (node.department as any)?.address_text || '',
          },
          level_id: node.level_id
            ? ((node.level_id as any)?._id as Types.ObjectId)?.toString() || ''
            : '',
          level: (node.level_id as any)?.level || 0, // *** NUEVA PROPIEDAD ***
          ui_hints: node.ui_hints || {},
          children: [],

          // *** DATOS DE PERSONAS ***
          responsible_official: node.responsible_official
            ? {
                _id: (
                  node.responsible_official._id as Types.ObjectId
                ).toString(),
                firstname: node.responsible_official.firstname,
                lastname: node.responsible_official.lastname,
                person_type: node.responsible_official.person_type,
                photo_url: node.responsible_official.photo_url,
                job_title_text: node.responsible_official.job_title_text,
              }
            : null,

          assigned_assessors:
            node.assigned_assessors && node.assigned_assessors.length > 0
              ? node.assigned_assessors.map((assessor: any) => ({
                  _id: (assessor._id as Types.ObjectId).toString(),
                  firstname: assessor.firstname,
                  lastname: assessor.lastname,
                  person_type: assessor.person_type,
                  photo_url: assessor.photo_url,
                  expertise_area: assessor.expertise_area,
                }))
              : [],
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
        .populate('department', 'name code objective address_text')
        .populate('level_id', 'name level')
        .populate(
          'responsible_official',
          'firstname lastname person_type photo_url job_title_text',
        )
        .populate(
          'assigned_assessors',
          'firstname lastname person_type photo_url expertise_area',
        )
        .lean();

      if (!rootNode) {
        throw new NotFoundException(`Nodo con ID ${nodeId} no encontrado.`);
      }

      // FUNCIÓN RECURSIVA para obtener todos los descendientes
      const getAllDescendants = async (
        parentNodeId: string,
      ): Promise<any[]> => {
        // Buscar hijos directos
        const directChildren = await this.departmentNodeModel
          .find({
            version: rootNode.version,
            parent_node: new Types.ObjectId(parentNodeId),
          })
          .populate('department', 'name code objective address_text')
          .populate('level_id', 'name level')
          .populate(
            'responsible_official',
            'firstname lastname person_type photo_url job_title_text',
          )
          .populate(
            'assigned_assessors',
            'firstname lastname person_type photo_url expertise_area',
          )
          .lean();

        let allDescendants = [...directChildren];

        // Para cada hijo directo, obtener sus descendientes recursivamente
        for (const child of directChildren) {
          const childDescendants = await getAllDescendants(
            (child._id as Types.ObjectId).toString(),
          );
          allDescendants = allDescendants.concat(childDescendants);
        }

        return allDescendants;
      };

      // Obtener todos los descendientes del nodo raíz
      const descendants = await getAllDescendants(nodeId);

      this.logger.log(
        `Encontrados ${descendants.length} descendientes para ${nodeId}`,
      );

      // Construir el nodo raíz manualmente
      const rootNodeFormatted: OrganigramNodeDto = {
        frontend_id: (rootNode._id as Types.ObjectId).toString(),
        parentId: rootNode.parent_node
          ? (rootNode.parent_node as Types.ObjectId).toString()
          : null,
        department_data: {
          name: (rootNode.department as any)?.name || 'Sin nombre',
          code: (rootNode.department as any)?.code || '',
          objective: (rootNode.department as any)?.objective || '',
          address_text: (rootNode.department as any)?.address_text || '',
        },
        level_id: rootNode.level_id
          ? ((rootNode.level_id as any)?._id as Types.ObjectId)?.toString() ||
            ''
          : '',
        level: (rootNode.level_id as any)?.level || 0,
        ui_hints: rootNode.ui_hints || {},
        children: [],

        // AGREGAR DATOS DE PERSONAS
        responsible_official: (rootNode as any).responsible_official
          ? {
              _id: (
                (rootNode as any).responsible_official._id as Types.ObjectId
              ).toString(),
              firstname: (rootNode as any).responsible_official.firstname,
              lastname: (rootNode as any).responsible_official.lastname,
              person_type: (rootNode as any).responsible_official.person_type,
              photo_url: (rootNode as any).responsible_official.photo_url,
              job_title_text: (rootNode as any).responsible_official
                .job_title_text,
            }
          : null,

        assigned_assessors:
          (rootNode as any).assigned_assessors &&
          (rootNode as any).assigned_assessors.length > 0
            ? (rootNode as any).assigned_assessors.map((assessor: any) => ({
                _id: (assessor._id as Types.ObjectId).toString(),
                firstname: assessor.firstname,
                lastname: assessor.lastname,
                person_type: assessor.person_type,
                photo_url: assessor.photo_url,
                expertise_area: assessor.expertise_area,
              }))
            : [],
      };

      // Si no hay descendientes, devolver solo el nodo raíz
      if (descendants.length === 0) {
        this.logger.log(
          `No hay descendientes para ${nodeId}, devolviendo solo el nodo raíz`,
        );
        return rootNodeFormatted;
      }

      // Crear mapa para construcción de jerarquía - INCLUIR EL NODO RAÍZ
      const nodeMap = new Map<string, OrganigramNodeDto>();
      nodeMap.set(rootNodeFormatted.frontend_id, rootNodeFormatted);

      // Procesar TODOS los descendientes y agregarlos al mapa
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
            address_text: (descendant.department as any)?.address_text || '',
          },
          level_id: descendant.level_id
            ? (
                (descendant.level_id as any)?._id as Types.ObjectId
              )?.toString() || ''
            : '',
          level: (descendant.level_id as any)?.level || 0,
          ui_hints: descendant.ui_hints || {},
          children: [],

          // AGREGAR DATOS DE PERSONAS
          responsible_official: (descendant as any).responsible_official
            ? {
                _id: (
                  (descendant as any).responsible_official._id as Types.ObjectId
                ).toString(),
                firstname: (descendant as any).responsible_official.firstname,
                lastname: (descendant as any).responsible_official.lastname,
                person_type: (descendant as any).responsible_official
                  .person_type,
                photo_url: (descendant as any).responsible_official.photo_url,
                job_title_text: (descendant as any).responsible_official
                  .job_title_text,
              }
            : null,

          assigned_assessors:
            (descendant as any).assigned_assessors &&
            (descendant as any).assigned_assessors.length > 0
              ? (descendant as any).assigned_assessors.map((assessor: any) => ({
                  _id: (assessor._id as Types.ObjectId).toString(),
                  firstname: assessor.firstname,
                  lastname: assessor.lastname,
                  person_type: assessor.person_type,
                  photo_url: assessor.photo_url,
                  expertise_area: assessor.expertise_area,
                }))
              : [],
        };

        nodeMap.set(descendantFormatted.frontend_id, descendantFormatted);
      }

      // Construir relaciones padre-hijo para TODOS los nodos
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
              `No se pudo crear relación ${parentKey} -> ${childKey}. Parent: ${!!parent}, Child: ${!!child}`,
            );
          }
        }
      }

      this.logger.log(
        `Estructura de descendientes construida exitosamente para ${nodeId}. Total nodos en el árbol: ${nodeMap.size}`,
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

  async getNodesByLevel(
    versionId: string,
    levelId: string,
  ): Promise<OrganigramNodeDto[]> {
    const nodes = await this.departmentNodeModel
      .find({
        version: new Types.ObjectId(versionId),
        level_id: new Types.ObjectId(levelId),
      })
      .populate('department', 'name code objective address_text')
      .populate('level_id', 'name level') // *** INCLUIR 'level' ***
      .populate(
        'responsible_official',
        'firstname lastname person_type photo_url job_title_text',
      )
      .populate(
        'assigned_assessors',
        'firstname lastname person_type photo_url expertise_area',
      )
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
        address_text: (node.department as any).address_text || '',
      },
      level_id: node.level_id
        ? ((node.level_id as any)._id as Types.ObjectId).toString()
        : '',
      level: (node.level_id as any)?.level || 0, // *** NUEVA PROPIEDAD ***
      ui_hints: node.ui_hints || {},
      children: [],

      // *** DATOS DE PERSONAS ***
      responsible_official: (node as any).responsible_official
        ? {
            _id: (
              (node as any).responsible_official._id as Types.ObjectId
            ).toString(),
            firstname: (node as any).responsible_official.firstname,
            lastname: (node as any).responsible_official.lastname,
            person_type: (node as any).responsible_official.person_type,
            photo_url: (node as any).responsible_official.photo_url,
            job_title_text: (node as any).responsible_official.job_title_text,
          }
        : null,

      assigned_assessors:
        (node as any).assigned_assessors &&
        (node as any).assigned_assessors.length > 0
          ? (node as any).assigned_assessors.map((assessor: any) => ({
              _id: (assessor._id as Types.ObjectId).toString(),
              firstname: assessor.firstname,
              lastname: assessor.lastname,
              person_type: assessor.person_type,
              photo_url: assessor.photo_url,
              expertise_area: assessor.expertise_area,
            }))
          : [],
    }));
  }

  async getDirectChildren(nodeId: string): Promise<OrganigramNodeDto[]> {
    const children = await this.departmentNodeModel
      .find({ parent_node: new Types.ObjectId(nodeId) })
      .populate('department', 'name code objective address_text')
      .populate('level_id', 'name level') // *** INCLUIR 'level' ***
      .populate(
        'responsible_official',
        'firstname lastname person_type photo_url job_title_text',
      )
      .populate(
        'assigned_assessors',
        'firstname lastname person_type photo_url expertise_area',
      )
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
        address_text: (node.department as any).address_text || '',
      },
      level_id: node.level_id
        ? ((node.level_id as any)._id as Types.ObjectId).toString()
        : '',
      level: (node.level_id as any)?.level || 0, // *** NUEVA PROPIEDAD ***
      ui_hints: node.ui_hints || {},
      children: [],

      // *** DATOS DE PERSONAS ***
      responsible_official: (node as any).responsible_official
        ? {
            _id: (
              (node as any).responsible_official._id as Types.ObjectId
            ).toString(),
            firstname: (node as any).responsible_official.firstname,
            lastname: (node as any).responsible_official.lastname,
            person_type: (node as any).responsible_official.person_type,
            photo_url: (node as any).responsible_official.photo_url,
            job_title_text: (node as any).responsible_official.job_title_text,
          }
        : null,

      assigned_assessors:
        (node as any).assigned_assessors &&
        (node as any).assigned_assessors.length > 0
          ? (node as any).assigned_assessors.map((assessor: any) => ({
              _id: (assessor._id as Types.ObjectId).toString(),
              firstname: assessor.firstname,
              lastname: assessor.lastname,
              person_type: assessor.person_type,
              photo_url: assessor.photo_url,
              expertise_area: assessor.expertise_area,
            }))
          : [],
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

      // Refrescar cache público automáticamente (no bloqueante)
      this.cacheWarmingService
        .refreshPublicCache()
        .then(() => {
          this.logger.log(
            '✅ Cache público refrescado después de activar versión',
          );
        })
        .catch((error) => {
          this.logger.error(
            `⚠️ Error refrescando cache después de activar versión: ${error.message}`,
          );
        });

      return version;
    } catch (error) {
      this.logger.error(
        `Error activando versión ${versionId}: ${error.message}`,
      );
      throw error;
    }
  }

  async assignResponsibleOfficial(
    dto: AssignResponsibleOfficialDto,
  ): Promise<OrganigramVersion> {
    const { versionId, responsibleId, nodeId } = dto;

    // Validar existencia de entidades en paralelo
    const [version, node, responsiblePerson] = await Promise.all([
      this.validateVersionExists(versionId),
      this.validateNodeExists(nodeId),
      this.validateResponsibleOfficial(responsibleId),
    ]);

    // Actualizar el nodo con el funcionario responsable
    await this.updateNodeResponsible(nodeId, responsibleId);

    return version;
  }

  async removeResponsibleOfficialFromNode(
    versionId: string,
    nodeId: string,
  ): Promise<OrganigramVersion> {
    // Validar existencia de entidades
    const [version, node] = await Promise.all([
      this.validateVersionExists(versionId),
      this.validateNodeExists(nodeId),
    ]);

    // Remover el funcionario responsable
    await this.removeNodeResponsible(nodeId);

    this.logger.log(
      `Funcionario responsable removido exitosamente del nodo ${nodeId}`,
    );

    // Refrescar cache público automáticamente (no bloqueante) si la versión es activa
    if (version.is_active) {
      this.cacheWarmingService
        .refreshPublicCache()
        .then(() => {
          this.logger.log(
            '✅ Cache público refrescado después de remover funcionario',
          );
        })
        .catch((error) => {
          this.logger.error(
            `⚠️ Error refrescando cache después de remover funcionario: ${error.message}`,
          );
        });
    }

    return version;
  }

  private async removeNodeResponsible(nodeId: string): Promise<void> {
    const result = await this.departmentNodeModel.updateOne(
      { _id: nodeId },
      { $unset: { responsible_official: "" } },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException(
        `No se pudo actualizar el nodo con ID ${nodeId}`,
      );
    }
  }

  private async validateVersionExists(
    versionId: string,
  ): Promise<OrganigramVersion> {
    const version = await this.organigramVersionModel.findById(versionId);
    if (!version) {
      throw new NotFoundException(
        `Versión del organigrama con ID ${versionId} no encontrada`,
      );
    }
    return version;
  }

  private async validateNodeExists(nodeId: string): Promise<any> {
    const node = await this.departmentNodeModel.findById(nodeId);
    if (!node) {
      throw new NotFoundException(
        `Nodo de departamento con ID ${nodeId} no encontrado`,
      );
    }
    return node;
  }

  private async validateResponsibleOfficial(
    responsibleId: string,
  ): Promise<any> {
    const person = await this.peopleService.findOne(responsibleId);

    if (!person) {
      throw new NotFoundException(
        `Funcionario con ID ${responsibleId} no encontrado`,
      );
    }

    if (person.person_type !== 'official') {
      throw new BadRequestException(
        `La persona con ID ${responsibleId} no tiene el tipo de funcionario requerido`,
      );
    }

    return person;
  }

  private async updateNodeResponsible(
    nodeId: string,
    responsibleId: string,
  ): Promise<void> {
    const result = await this.departmentNodeModel.updateOne(
      { _id: nodeId },
      { $set: { responsible_official: new Types.ObjectId(responsibleId) } },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException(
        `No se pudo actualizar el nodo con ID ${nodeId}`,
      );
    }
  }

  async assignAssessors(dto: AssignAssessorsDto): Promise<OrganigramVersion> {
    const { versionId, assessorIds, nodeId } = dto;

    // Validar existencia de entidades en paralelo
    const [version, node, assessors] = await Promise.all([
      this.validateVersionExists(versionId),
      this.validateNodeExists(nodeId),
      this.validateAssessors(assessorIds),
    ]);

    // Validar que los asesores no estén asignados a otros nodos
    await this.validateAssessorsNotAssignedToOtherNodes(
      assessorIds,
      nodeId,
      versionId,
    );

    // Actualizar el nodo con los asesores
    await this.updateNodeAssessors(nodeId, assessorIds);

    this.logger.log(
      `Asesores asignados exitosamente al nodo ${nodeId}: ${assessorIds.join(', ')}`,
    );

    return version;
  }

  /**
   * Valida que los asesores no estén asignados a otros nodos en la misma versión
   */
  private async validateAssessorsNotAssignedToOtherNodes(
    assessorIds: string[],
    currentNodeId: string,
    versionId: string,
  ): Promise<void> {
    const assessorObjectIds = assessorIds.map((id) => new Types.ObjectId(id));

    // 1. Encontrar nodos *diferentes* al actual, en la misma versión,
    // que ya tengan asignado *al menos uno* de los asesores que se intenta asignar.
    const nodesInConflict = await this.departmentNodeModel
      .find({
        version: new Types.ObjectId(versionId), // Misma versión
        _id: { $ne: new Types.ObjectId(currentNodeId) }, // Excluir el nodo actual
        // Buscar cualquier nodo donde el array 'assigned_assessors' contenga
        // alguno de los IDs en 'assessorObjectIds'
        assigned_assessors: { $in: assessorObjectIds },
      })
      // Solo necesitamos el ID del nodo y el departamento (para el nombre en el error)
      .select('_id department')
      .populate('department', 'name') // Usamos populate para obtener el nombre del departamento
      .lean();

    if (nodesInConflict.length === 0) {
      return; // No hay conflictos
    }

    // 2. Procesar los conflictos encontrados
    const conflictedAssessorIds: string[] = [];
    const nodeConflictsMap = new Map<string, string>(); // Map<assessorId, nodeName>

    // Obtener todos los IDs de asesores que ya están asignados en los nodos conflictivos
    // (aunque el query solo trae los nodos, no la lista filtrada de asesores)
    const conflictNodeIds = nodesInConflict.map((node) => node._id);

    // Segunda consulta: Obtener solo los asesores de esos nodos conflictivos.
    // Aunque es una segunda consulta, el filtro es muy específico.
    const conflictNodesWithAssessors = await this.departmentNodeModel
      .find({ _id: { $in: conflictNodeIds } })
      .select('assigned_assessors department')
      .populate('department', 'name')
      .lean();

    for (const node of conflictNodesWithAssessors) {
      // Asegurarse de que el departamento esté poblado y tenga nombre, o usar el ID
      const nodeName = (node.department as any)?.name || node._id.toString();

      for (const assessorId of node.assigned_assessors || []) {
        const assessorIdStr = assessorId.toString();
        // Solo nos interesan los IDs que intentamos asignar
        if (
          assessorIds.includes(assessorIdStr) &&
          !nodeConflictsMap.has(assessorIdStr)
        ) {
          nodeConflictsMap.set(assessorIdStr, nodeName);
          conflictedAssessorIds.push(assessorIdStr);
        }
      }
    }

    if (nodeConflictsMap.size > 0) {
      // 3. Obtener los nombres de los asesores para el mensaje de error
      // Asumo que tienes un servicio para buscar personas por ID (peopleService o usersRepository)
      // Como tu código original usa this.usersRepository.findOne, usaré this.peopleService.findOne
      // basado en la inyección de dependencias que muestras.
      const conflictedAssessors = await Promise.all(
        Array.from(nodeConflictsMap.keys()).map((id) =>
          this.peopleService.findOne(id),
        ),
      );

      const conflicts = Array.from(nodeConflictsMap.entries()).map(
        ([assessorId, nodeName]) => {
          const assessor = conflictedAssessors.find(
            (a) => a && (a._id as Types.ObjectId).toString() === assessorId,
          );
          const assessorName =
            assessor?.firstname && assessor?.lastname
              ? `${assessor.firstname} ${assessor.lastname}`
              : assessorId;

          return `${assessorName} ya está asignado al departamento ${nodeName}`;
        },
      );

      throw new BadRequestException({
        message:
          'No se pueden asignar los asesores porque ya están asignados a otros departamentos',
        errors: conflicts,
      });
    }
  }

  private async validateAssessors(assessorIds: string[]): Promise<any[]> {
    const assessors = await Promise.all(
      assessorIds.map((id) => this.peopleService.findOne(id)),
    );

    // Validar que todas las personas existen
    const notFound = assessorIds.filter((id, index) => !assessors[index]);
    if (notFound.length > 0) {
      throw new NotFoundException(
        `Los siguientes asesores no fueron encontrados: ${notFound.join(', ')}`,
      );
    }

    // Validar que todas las personas son asesores
    const invalidTypes = assessors.filter(
      (assessor) => assessor.person_type !== 'assessor',
    );
    if (invalidTypes.length > 0) {
      const invalidIds = invalidTypes.map((assessor) =>
        assessor._id?.toString(),
      );
      throw new BadRequestException(
        `Las siguientes personas no tienen el tipo de asesor requerido: ${invalidIds.join(', ')}`,
      );
    }

    return assessors;
  }

  private async updateNodeAssessors(
    nodeId: string,
    assessorIds: string[],
  ): Promise<void> {
    const objectIds = assessorIds.map((id) => new Types.ObjectId(id));

    const result = await this.departmentNodeModel.updateOne(
      { _id: nodeId },
      { $set: { assigned_assessors: objectIds } },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException(
        `No se pudo actualizar el nodo con ID ${nodeId}`,
      );
    }
  }

  async addAssessorsToNode(
    dto: AssignAssessorsDto,
  ): Promise<OrganigramVersion> {
    const { versionId, assessorIds, nodeId } = dto;

    // Validar existencia de entidades en paralelo
    const [version, node, assessors] = await Promise.all([
      this.validateVersionExists(versionId),
      this.validateNodeExists(nodeId),
      this.validateAssessors(assessorIds),
    ]);

    // Agregar los asesores a los existentes (sin duplicados)
    await this.addAssessorsToExisting(nodeId, assessorIds);

    this.logger.log(
      `Asesores agregados exitosamente al nodo ${nodeId}: ${assessorIds.join(', ')}`,
    );

    return version;
  }

  private async addAssessorsToExisting(
    nodeId: string,
    assessorIds: string[],
  ): Promise<void> {
    const objectIds = assessorIds.map((id) => new Types.ObjectId(id));

    const result = await this.departmentNodeModel.updateOne(
      { _id: nodeId },
      {
        $addToSet: {
          assigned_assessors: { $each: objectIds },
        },
      },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException(
        `No se pudo actualizar el nodo con ID ${nodeId}`,
      );
    }
  }

  async removeAssessorsFromNode(
    versionId: string,
    nodeId: string,
    assessorIds: string[],
  ): Promise<OrganigramVersion> {
    // Validar existencia de entidades
    const [version, node] = await Promise.all([
      this.validateVersionExists(versionId),
      this.validateNodeExists(nodeId),
    ]);

    // Remover los asesores especificados
    await this.removeAssessorsFromExisting(nodeId, assessorIds);

    this.logger.log(
      `Asesores removidos exitosamente del nodo ${nodeId}: ${assessorIds.join(', ')}`,
    );

    return version;
  }

  private async removeAssessorsFromExisting(
    nodeId: string,
    assessorIds: string[],
  ): Promise<void> {
    const objectIds = assessorIds.map((id) => new Types.ObjectId(id));

    const result = await this.departmentNodeModel.updateOne(
      { _id: nodeId },
      {
        $pull: {
          assigned_assessors: { $in: objectIds },
        },
      },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException(
        `No se pudo actualizar el nodo con ID ${nodeId}`,
      );
    }
  }

  private async validateDecreeFile(fileId: string): Promise<void> {
    // Aquí validarías que el archivo existe y es un PDF
    // Implementar según tu sistema de archivos
    try {
      // Ejemplo de validación (ajustar según tu FileService)
      // const file = await this.fileService.findOne(fileId);
      // if (!file || !file.mimetype.includes('pdf')) {
      //   throw new BadRequestException('El archivo de decreto debe ser un PDF válido');
      // }

      this.logger.log(`Archivo de decreto validado: ${fileId}`);
    } catch (error) {
      throw new BadRequestException(
        `Error validando archivo de decreto: ${error.message}`,
      );
    }
  }

  private async processNodeRecursiveWithPeople(
    nodes: DepartmentNodeInputDto[],
    versionId: Types.ObjectId,
    parentMongoId: Types.ObjectId | null,
    frontendIdToMongoIdMap: FrontendToMongoIdMap,
    parentHierarchicalPath: string = '',
    session: any,
  ): Promise<void> {
    for (const nodeInput of nodes) {
      let departmentRecord: any = null;

      // Construir el path jerárquico esperado
      const expectedHierarchicalPath = parentHierarchicalPath
        ? `${parentHierarchicalPath}/${nodeInput.department_data.name}`
        : nodeInput.department_data.name;

      // ESTRATEGIA SIMPLIFICADA:
      // 1. Buscar por código si existe (más específico)
      if (nodeInput.department_data.code) {
        departmentRecord = await this.departmentsService.findByCode(
          nodeInput.department_data.code,
        );
      }

      // 2. Si no tiene código o no se encontró por código, buscar por nombre
      if (!departmentRecord) {
        departmentRecord = await this.departmentsService.findByName(
          nodeInput.department_data.name,
        );
      }

      // 3. Validar que no exista conflicto jerárquico (CON SESSION)
      if (departmentRecord) {
        const existingNodeWithSameDept = await this.departmentNodeModel
          .findOne({
            version: versionId,
            department: departmentRecord._id,
          })
          .session(session);

        if (existingNodeWithSameDept) {
          throw new ConflictException(
            `El departamento "${nodeInput.department_data.name}" ya existe en esta versión del organigrama en otra ubicación.`,
          );
        }
      }

      // 4. Crear departamento si no existe
      if (!departmentRecord) {
        this.logger.log(
          `Creando nuevo departamento: ${nodeInput.department_data.name}`,
        );

        const createDepartmentDto: CreateDepartmentDto = {
          name: nodeInput.department_data.name,
          code: nodeInput.department_data.code,
          objective: nodeInput.department_data.objective,
          is_active: true,
        };

        const createdDepartment =
          await this.departmentsService.create(createDepartmentDto);

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
          `Nivel con ID '${nodeInput.level_id}' no encontrado.`,
        );
      }

      // Validar personas si se proporcionan
      let responsibleOfficialId: Types.ObjectId | null = null;
      let assignedAssessorIds: Types.ObjectId[] = [];

      if (nodeInput.responsible_official_id) {
        responsibleOfficialId = await this.validateAndGetResponsibleOfficial(
          nodeInput.responsible_official_id,
        );
      }

      if (
        nodeInput.assigned_assessor_ids &&
        nodeInput.assigned_assessor_ids.length > 0
      ) {
        assignedAssessorIds = await this.validateAndGetAssessors(
          nodeInput.assigned_assessor_ids,
        );
      }

      // Crear el DepartmentNode (CON SESSION)
      const nodeDataToCreate = {
        version: versionId,
        department: new Types.ObjectId(departmentRecord._id as string),
        level_id: new Types.ObjectId(levelRecord._id as string),
        parent_node: parentMongoId,
        responsible_official: responsibleOfficialId,
        assigned_assessors: assignedAssessorIds,
        ui_hints: nodeInput.ui_hints || {},
      };

      const createdNodes = await this.departmentNodeModel.create(
        [nodeDataToCreate],
        { session },
      );
      const newDepartmentNode = createdNodes[0];

      frontendIdToMongoIdMap[nodeInput.frontend_id] =
        newDepartmentNode._id as Types.ObjectId;

      this.logger.log(
        `DepartmentNode creado: ${newDepartmentNode._id} para ${nodeInput.department_data.name} en path: ${expectedHierarchicalPath}`,
      );

      // Procesar hijos recursivamente (CON SESSION)
      if (nodeInput.children && nodeInput.children.length > 0) {
        await this.processNodeRecursiveWithPeople(
          nodeInput.children,
          versionId,
          newDepartmentNode._id as Types.ObjectId,
          frontendIdToMongoIdMap,
          expectedHierarchicalPath,
          session,
        );
      }
    }
  }

  private async validateAndGetResponsibleOfficial(
    officialId: string,
  ): Promise<Types.ObjectId> {
    const official = await this.peopleService.findOne(officialId);

    if (!official) {
      throw new NotFoundException(
        `Funcionario con ID ${officialId} no encontrado`,
      );
    }

    if (official.person_type !== 'official') {
      throw new BadRequestException(
        `La persona con ID ${officialId} no es un funcionario (tipo requerido: OFFICIAL)`,
      );
    }

    return new Types.ObjectId(officialId);
  }

  private async validateAndGetAssessors(
    assessorIds: string[],
  ): Promise<Types.ObjectId[]> {
    const assessors = await Promise.all(
      assessorIds.map((id) => this.peopleService.findOne(id)),
    );

    // Validar que todos existen
    const notFound = assessorIds.filter((id, index) => !assessors[index]);
    if (notFound.length > 0) {
      throw new NotFoundException(
        `Los siguientes asesores no fueron encontrados: ${notFound.join(', ')}`,
      );
    }

    // Validar que todos son asesores
    const invalidTypes = assessors.filter(
      (assessor) => assessor.person_type !== 'assessor',
    );
    if (invalidTypes.length > 0) {
      const invalidIds = invalidTypes.map((assessor) =>
        assessor._id?.toString(),
      );
      throw new BadRequestException(
        `Las siguientes personas no son asesores (tipo requerido: ASSESSOR): ${invalidIds.join(', ')}`,
      );
    }

    return assessorIds.map((id) => new Types.ObjectId(id));
  }

  async findNodesByHierarchicalPath(
    versionId: string,
    hierarchicalPath: string,
  ): Promise<DepartmentNode[]> {
    return await this.departmentNodeModel
      .find({
        version: new Types.ObjectId(versionId),
        hierarchical_path: { $regex: hierarchicalPath, $options: 'i' },
      })
      .populate('department')
      .populate('level_id')
      .populate('responsible_official')
      .populate('assigned_assessors');
  }

  // Método para obtener estadísticas de duplicados por versión
  async getDuplicatedDepartmentsInVersion(versionId: string): Promise<any> {
    const duplicates = await this.departmentNodeModel.aggregate([
      { $match: { version: new Types.ObjectId(versionId) } },
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'dept_info',
        },
      },
      { $unwind: '$dept_info' },
      {
        $group: {
          _id: '$dept_info.name',
          count: { $sum: 1 },
          nodes: {
            $push: {
              nodeId: '$_id',
              hierarchical_path: '$hierarchical_path',
              level: '$level_id',
            },
          },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return duplicates;
  }

  async uploadDecreeToVersion(
    versionId: string,
    decree_file: Express.Multer.File,
  ): Promise<OrganigramVersion> {
    this.logger.log(`Subiendo decreto para versión existente: ${versionId}`);

    try {
      // 1. Verificar que la versión existe
      const existingVersion =
        await this.organigramVersionModel.findById(versionId);
      if (!existingVersion) {
        throw new NotFoundException(
          `Versión del organigrama con ID ${versionId} no encontrada`,
        );
      }

      // 2. Subir el archivo de decreto
      const fileName = `decreto-${existingVersion.version_tag.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      const decree_file_url = await this.fileUploadService.uploadFile(
        decree_file,
        fileName,
      );

      this.logger.log(`Decreto subido exitosamente: ${decree_file_url}`);

      // 3. Actualizar la versión con la URL del decreto
      const updatedVersion =
        await this.organigramVersionModel.findByIdAndUpdate(
          versionId,
          {
            decree_file_url: decree_file_url,
          },
          { new: true },
        );

      this.logger.log(`Versión ${versionId} actualizada con decreto`);

      return updatedVersion!;
    } catch (error) {
      this.logger.error(
        `Error al subir decreto para versión ${versionId}: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Error al procesar el archivo de decreto: ${error.message}`,
      );
    }
  }
}
