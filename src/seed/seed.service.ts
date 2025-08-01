import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Level } from '../levels/entities/level.entity';
import { Model } from 'mongoose';

interface ILevel {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(Level.name)
    private readonly levelModel: Model<Level>,
  ) {}

  async executeSeed() {
    await this.levelModel.deleteMany({});

    const levelToInsert: ILevel[] = [
      {
        name: 'intendencia',
        description: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'secretaría',
        description: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'subsecretaría',
        description: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'dirección general',
        description: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'dirección',
        description: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'administración',
        description: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'supervisión',
        description: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await this.levelModel.insertMany(levelToInsert);

    return 'Seed Executed';
  }
}
