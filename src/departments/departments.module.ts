import { Module } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { DepartmentsController } from './departments.controller';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Department, DepartmentSchema } from './entities/department.entity';

@Module({
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      {
        name: Department.name,
        schema: DepartmentSchema,
      },
    ]),
  ],
  exports: [MongooseModule],
})
export class DepartmentsModule {}
