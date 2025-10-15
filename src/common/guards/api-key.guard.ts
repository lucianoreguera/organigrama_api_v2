import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AppsService } from '../../apps/apps.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly appsService: AppsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API Key requerida');
    }

    // Validar que la API Key existe
    const apps = await this.appsService.findAll();
    const validApp = apps.find((app) => app.apiKey === apiKey);

    if (!validApp) {
      throw new UnauthorizedException('API Key inválida');
    }

    // Opcional: agregar info de la app al request para uso posterior
    request.app = validApp;

    return true;
  }
}
