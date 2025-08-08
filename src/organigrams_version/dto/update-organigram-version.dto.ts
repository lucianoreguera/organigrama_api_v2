import { PartialType } from '@nestjs/mapped-types';
import { CreateOrganigramVersionDto } from './create-organigram-version.dto';

export class UpdateOrganigramVersionDto extends PartialType(
  CreateOrganigramVersionDto,
) {}
