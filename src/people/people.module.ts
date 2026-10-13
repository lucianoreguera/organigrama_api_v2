import { Module } from '@nestjs/common';
import { PeopleService } from './people.service';
import { PeopleController } from './people.controller';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Person, PersonSchema } from './entities/person.entity';
import { PublicOrganigramModule } from '../public-organigram/public-organigram.module';

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
    PublicOrganigramModule, // Para refrescar el cache público
  ],
  exports: [MongooseModule, PeopleService],
})
export class PeopleModule {}
