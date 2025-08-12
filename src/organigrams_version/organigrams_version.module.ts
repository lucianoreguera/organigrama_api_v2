import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganigramVersionsService } from './organigrams_version.service';
import { OrganigramVersionsController } from './organigrams_version.controller';
import {
  OrganigramVersion,
  OrganigramVersionSchema,
} from './entities/organigram-version.entity';
import {
  DepartmentNode,
  DepartmentNodeSchema,
} from './entities/department-node.entity';
import { DepartmentsModule } from '../departments/departments.module';
import { LevelsModule } from '../levels/levels.module';
import { PeopleModule } from '../people/people.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: OrganigramVersion.name,
        schema: OrganigramVersionSchema,
      },
      {
        name: DepartmentNode.name,
        schema: DepartmentNodeSchema,
      },
    ]),
    DepartmentsModule, // Para usar DepartmentsService
    LevelsModule, // Para usar LevelsService
    PeopleModule, // Para usar PeopleService
  ],
  controllers: [OrganigramVersionsController],
  providers: [OrganigramVersionsService],
  exports: [
    OrganigramVersionsService,
    MongooseModule, // Exportar los modelos si otros módulos los necesitan
  ],
})
export class OrganigramsVersionModule {}
