import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrganigramVersion } from '../organigrams_version/entities/organigram-version.entity';
import { DepartmentNode } from '../organigrams_version/entities/department-node.entity';
import { Level } from '../levels/entities/level.entity';
import { PersonType } from '../people/enums/person-type.enums';
import {
  SecretariaResponseDto,
  DepartmentFlatResponseDto,
  PersonaCargoDto,
  PersonaPublicaResponseDto,
  PersonaRol,
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

    const secretariaDto: DepartmentFlatResponseDto = {
      id: (secretariaNode._id as Types.ObjectId).toString(),
      nombre: (secretariaNode.department as any).name,
      codigo: (secretariaNode.department as any).code || undefined,
      nivel: (secretariaNode.level_id as any)?.name || '',
      path_jerarquico: secretariaNode.hierarchical_path || undefined,
      profundidad: secretariaNode.depth || 0,
    };

    return [
      secretariaDto,
      ...descendants
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
      })),
    ];
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

  async getDepartmentInfoByNodeId(
    nodeId: string,
  ): Promise<{ departmento: string; nivel: string }> {
    const node = await this.departmentNodeModel
      .findById(nodeId)
      .populate('department', 'name')
      .populate('level_id', 'name')
      .lean();

    if (!node) {
      throw new NotFoundException(`Nodo con ID ${nodeId} no encontrado`);
    }

    return {
      departmento: (node.department as any)?.name || '',
      nivel: (node.level_id as any)?.name || '',
    };
  }

  /**
   * Lista todos los funcionarios y asesores asignados a nodos de la versión activa,
   * agrupados por persona con los nodos donde están asignados
   */
  async getAllPersonas(): Promise<PersonaPublicaResponseDto[]> {
    this.logger.log(
      'Obteniendo funcionarios y asesores del organigrama activo',
    );

    const activeVersion = await this.getActiveVersion();

    const nodes = await this.departmentNodeModel
      .find({
        version: activeVersion._id,
        $or: [
          { responsible_official: { $ne: null } },
          { 'assigned_assessors.0': { $exists: true } },
        ],
      })
      .populate('department', 'name code')
      .populate('level_id', 'name')
      .populate('responsible_official')
      .populate('assigned_assessors')
      .lean();

    const personas = new Map<string, PersonaPublicaResponseDto>();

    const addCargo = (person: any, cargo: PersonaCargoDto) => {
      // Persona borrada (populate devuelve null) o inactiva
      if (!person || person.is_active === false) return;

      const id = (person._id as Types.ObjectId).toString();
      if (!personas.has(id)) {
        personas.set(id, this.toPersonaDto(person));
      }
      personas.get(id)!.cargos.push(cargo);
    };

    for (const node of nodes) {
      addCargo(
        node.responsible_official,
        this.toCargo(node, PersonaRol.RESPONSABLE),
      );

      for (const assessor of node.assigned_assessors || []) {
        addCargo(assessor, this.toCargo(node, PersonaRol.ASESOR));
      }
    }

    const minDepth = (persona: PersonaPublicaResponseDto) =>
      Math.min(...persona.cargos.map((cargo) => cargo.profundidad));

    const result = [...personas.values()].sort((a, b) => {
      // Funcionarios primero, luego asesores
      if (a.tipo !== b.tipo) {
        return a.tipo === PersonType.OFFICIAL ? -1 : 1;
      }
      const depthDiff = minDepth(a) - minDepth(b);
      if (depthDiff !== 0) return depthDiff;
      return (a.apellido || '').localeCompare(b.apellido || '');
    });

    const officials = result.filter(
      (persona) => persona.tipo === PersonType.OFFICIAL,
    ).length;
    this.logger.log(
      `Se encontraron ${officials} funcionarios y ${result.length - officials} asesores`,
    );

    return result;
  }

  private toCargo(node: any, rol: PersonaRol): PersonaCargoDto {
    return {
      rol,
      nodo_id: (node._id as Types.ObjectId).toString(),
      departamento: (node.department as any)?.name || '',
      codigo: (node.department as any)?.code || undefined,
      nivel: (node.level_id as any)?.name || '',
      path_jerarquico: node.hierarchical_path || undefined,
      profundidad: node.depth || 0,
    };
  }

  private toPersonaDto(person: any): PersonaPublicaResponseDto {
    return {
      id: (person._id as Types.ObjectId).toString(),
      nombre: person.firstname,
      apellido: person.lastname,
      cuil: person.cuil,
      tipo: person.person_type,
      email: person.email || undefined,
      telefono: person.phone_number || undefined,
      foto_url: person.photo_url || undefined,
      bio: person.bio || undefined,
      redes_sociales: person.social_networks || undefined,
      titulo_cargo: person.job_title_text || undefined,
      area_especializacion: person.expertise_area || undefined,
      activo: person.is_active,
      cargos: [],
    };
  }
}
