import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { App } from '../../apps/entities/app.entity';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @InjectRepository(App)
    private readonly appRepository: Repository<App>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Permitir peticiones OPTIONS (preflight CORS)
    if (request.method === 'OPTIONS') {
      return true;
    }

    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API Key requerida');
    }

    // Buscar la aplicación por API Key
    const app = await this.appRepository.findOne({
      where: { apiKey, activo: true },
    });

    if (!app) {
      throw new UnauthorizedException('API Key inválida o inactiva');
    }

    // Agregar la app al request para usarla en el controller
    request.app = app;

    return true;
  }
}
