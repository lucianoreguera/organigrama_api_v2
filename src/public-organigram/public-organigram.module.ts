import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicOrganigramController } from './public-organigram.controller';
import { PublicOrganigramService } from './public-organigram.service';
import {
  OrganigramVersion,
  OrganigramVersionSchema,
} from '../organigrams_version/entities/organigram-version.entity';
import {
  DepartmentNode,
  DepartmentNodeSchema,
} from '../organigrams_version/entities/department-node.entity';
import { Level, LevelSchema } from '../levels/entities/level.entity';
import { AppsModule } from '../apps/apps.module';
import { CacheWarmingService } from './cache-warming.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OrganigramVersion.name, schema: OrganigramVersionSchema },
      { name: DepartmentNode.name, schema: DepartmentNodeSchema },
      { name: Level.name, schema: LevelSchema },
    ]),
    AppsModule, // Para el guard de API Key
  ],
  controllers: [PublicOrganigramController],
  providers: [PublicOrganigramService, CacheWarmingService],
  exports: [PublicOrganigramService, CacheWarmingService],
})
export class PublicOrganigramModule {}
