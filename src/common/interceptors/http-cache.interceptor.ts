import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CacheKeys } from './cache-keys.helper';

@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpCacheInterceptor.name);
  private readonly TTL = 86400000; // 24 horas en milisegundos (warming lo mantendrá fresco)

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, route } = request;

    // Solo cachear peticiones GET
    if (method !== 'GET') {
      return next.handle();
    }

    // Generar cache key usando el helper centralizado
    const cacheKey = CacheKeys.fromRoute(route.path, request.params);

    this.logger.debug(`🔑 Cache key: ${cacheKey}`);
    this.logger.debug(`📋 Route: ${route.path}`);
    this.logger.debug(`📋 Params: ${JSON.stringify(request.params)}`);

    try {
      // Intentar obtener del cache
      const cachedResponse = await this.cacheManager.get(cacheKey);

      if (cachedResponse) {
        this.logger.log(`✅ Cache HIT: ${cacheKey}`);
        return of(cachedResponse);
      }

      this.logger.log(`❌ Cache MISS: ${cacheKey}`);

      // Si no está en cache, ejecutar el handler y guardar el resultado
      return next.handle().pipe(
        tap(async (response) => {
          try {
            await this.cacheManager.set(cacheKey, response, this.TTL);
            this.logger.log(
              `💾 Guardado en cache: ${cacheKey} (TTL: ${this.TTL / 1000}s)`,
            );
          } catch (error) {
            this.logger.error(`Error guardando en cache: ${error.message}`);
          }
        }),
      );
    } catch (error) {
      this.logger.error(`Error en cache interceptor: ${error.message}`);
      // Si hay error con el cache, continuar sin cache
      return next.handle();
    }
  }
}
