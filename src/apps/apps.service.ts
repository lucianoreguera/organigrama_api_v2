import { Injectable } from '@nestjs/common';
import { CreateAppDto } from './dto/create-app.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { App } from './entities/app.entity';
import { handleExceptions } from '../common/helpers/handle-exception';

@Injectable()
export class AppsService {
  constructor(
    @InjectModel(App.name)
    private readonly appModel: Model<App>,
  ) {}

  async create(createAppDto: CreateAppDto) {
    try {
      createAppDto.apiKey = this.generateAPIKey();
      return await this.appModel.create(createAppDto);
    } catch (error) {
      handleExceptions(error, 'App');
    }
  }

  findAll() {
    return this.appModel.find();
  }

  private generateAPIKey(): string {
    const length = 32;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&';
    let apiKey = '';

    // Asegurar que tenga al menos: 1 mayúscula, 1 minúscula, 1 número, 1 especial
    apiKey += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    apiKey += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    apiKey += '0123456789'[Math.floor(Math.random() * 10)];
    apiKey += '@$!%*?&'[Math.floor(Math.random() * 7)];

    // Completar el resto
    for (let i = apiKey.length; i < length; i++) {
      apiKey += charset[Math.floor(Math.random() * charset.length)];
    }

    // Mezclar caracteres
    return apiKey
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }
}
