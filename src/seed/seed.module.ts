import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { LevelsModule } from '../levels/levels.module';

@Module({
  controllers: [SeedController],
  providers: [SeedService],
  imports: [LevelsModule],
})
export class SeedModule {}
