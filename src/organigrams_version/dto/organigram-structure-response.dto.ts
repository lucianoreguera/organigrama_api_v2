export class PersonSummaryDto {
  _id: string;
  firstname: string;
  lastname: string;
  person_type: string;
  photo_url?: string;
  job_title_text?: string;
  expertise_area?: string;
}

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
  level: number;
  ui_hints?: Record<string, any>;
  children: OrganigramNodeDto[];

  // Datos de personas
  responsible_official?: PersonSummaryDto | null;
  assigned_assessors?: PersonSummaryDto[];
}

export class OrganigramVersionDto {
  id: string;
  version_tag: string;
  effective_date: string;
  description?: string;
  is_active: boolean;
  decree_file_url?: string;
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
