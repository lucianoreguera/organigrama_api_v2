import { Module } from '@nestjs/common';
import { PeopleService } from './people.service';
import { PeopleController } from './people.controller';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Person, PersonSchema } from './entities/person.entity';

@Module({
  controllers: [PeopleController],
  providers: [PeopleService],
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      {
        name: Person.name,
        schema: PersonSchema,
      },
    ]),
  ],
  exports: [MongooseModule, PeopleService],
})
export class PeopleModule {}
