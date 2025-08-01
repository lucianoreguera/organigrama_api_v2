import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { LevelsService } from './levels.service';
import { LevelsController } from './levels.controller';
import { Level, LevelSchema } from './entities/level.entity';

@Module({
  controllers: [LevelsController],
  providers: [LevelsService],
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      {
        name: Level.name,
        schema: LevelSchema,
      },
    ]),
  ],
  exports: [MongooseModule],
})
export class LevelsModule {}
