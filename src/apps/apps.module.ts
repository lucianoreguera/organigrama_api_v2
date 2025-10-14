import { Module } from '@nestjs/common';
import { AppsService } from './apps.service';
import { AppsController } from './apps.controller';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { App, AppSchema } from './entities/app.entity';

@Module({
  controllers: [AppsController],
  providers: [AppsService],
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      {
        name: App.name,
        schema: AppSchema,
      },
    ]),
  ],
  exports: [MongooseModule, AppsService],
})
export class AppsModule {}
