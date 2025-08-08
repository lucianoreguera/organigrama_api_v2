export class DepartmentDataDto {
  name: string;

  code?: string;

  objective?: string;
}

export class OrganigramNodeDto {
  frontend_id: string;

  parentId: string | null;

  department_data: DepartmentDataDto;

  level_id: string;

  ui_hints?: Record<string, any>;

  children: OrganigramNodeDto[];
}

export class OrganigramVersionDto {
  id: string;

  version_tag: string;

  effective_date: string;

  description?: string;

  is_active: boolean;

  created_at: string;

  updated_at: string;
}

export class OrganigramStructureResponseDto {
  version: OrganigramVersionDto;

  nodes: OrganigramNodeDto[];
}

// DTO para respuestas de descendientes
export class NodeDescendantsResponseDto {
  node: OrganigramNodeDto;

  total_count: number;
}
