import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PublicOrganigramService } from './public-organigram.service';
import { CacheKeys } from '../common/interceptors/cache-keys.helper';

@Injectable()
export class CacheWarmingService {
  private readonly logger = new Logger(CacheWarmingService.name);
  private readonly TTL = 86400000; // 24 horas en milisegundos

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly publicOrganigramService: PublicOrganigramService,
  ) {}

  /**
   * Pre-cachea todos los endpoints públicos del organigrama
   */
  async warmPublicOrganigramCache(): Promise<void> {
    const startTime = Date.now();
    this.logger.log('🔥 Iniciando cache warming para endpoints públicos...');

    try {
      // 1. Pre-cachear lista de secretarías
      await this.warmSecretariasList();

      // 2. Pre-cachear hijos de todas las secretarías (en paralelo)
      await this.warmAllSecretariasChildren();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log(
        `✅ Cache warming completado exitosamente en ${duration}s`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error durante cache warming: ${error.message}`,
        error.stack,
      );
      // No lanzamos el error para que no rompa el inicio de la app
    }
  }

  /**
   * Pre-cachea la estructura completa del organigrama activo
   * (para backoffice y otros usos internos)
   */
  async warmActiveOrganigramStructure(
    organigramVersionsService: any,
  ): Promise<void> {
    try {
      this.logger.log(
        '🏗️  Pre-cacheando estructura completa del organigrama activo...',
      );

      const structure =
        await organigramVersionsService.getActiveOrganigramStructure();

      const cacheKey = CacheKeys.activeOrganigramStructure();
      await this.cacheManager.set(cacheKey, structure, this.TTL);

      this.logger.log('✅ Estructura completa del organigrama cacheada');
      this.logger.debug(`🔑 Cache Key guardada: ${cacheKey}`);
    } catch (error) {
      this.logger.error(
        `Error pre-cacheando estructura del organigrama: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Pre-cachea TODO: endpoints públicos + estructura completa
   */
  async warmAllCache(organigramVersionsService: any): Promise<void> {
    const startTime = Date.now();
    this.logger.log('🔥 Iniciando cache warming COMPLETO...');

    try {
      // Ejecutar ambos en paralelo para mayor velocidad
      await Promise.all([
        this.warmPublicOrganigramCache(),
        this.warmActiveOrganigramStructure(organigramVersionsService),
      ]);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log(`✅ Cache warming COMPLETO exitoso en ${duration}s`);
    } catch (error) {
      this.logger.error(
        `❌ Error durante cache warming completo: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Pre-cachea la lista de secretarías
   */
  private async warmSecretariasList(): Promise<void> {
    try {
      this.logger.log('📋 Pre-cacheando lista de secretarías...');

      const secretarias =
        await this.publicOrganigramService.getAllSecretarias();

      // Usar el helper para generar la key exacta que usará el interceptor
      const cacheKey = CacheKeys.secretariasList();
      await this.cacheManager.set(cacheKey, secretarias, this.TTL);

      this.logger.log(
        `✅ Lista de secretarías cacheada (${secretarias.length} items)`,
      );
      this.logger.debug(`🔑 Cache Key guardada: ${cacheKey}`);

      return;
    } catch (error) {
      this.logger.error(
        `Error pre-cacheando lista de secretarías: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Pre-cachea los hijos de todas las secretarías en paralelo
   */
  private async warmAllSecretariasChildren(): Promise<void> {
    try {
      // Obtener todas las secretarías primero
      const secretarias =
        await this.publicOrganigramService.getAllSecretarias();

      this.logger.log(
        `👶 Pre-cacheando hijos de ${secretarias.length} secretarías...`,
      );

      // Crear promesas para cachear en paralelo
      const warmingPromises = secretarias.map((secretaria) =>
        this.warmSecretariaChildren(secretaria.id),
      );

      // Ejecutar todas en paralelo
      const results = await Promise.allSettled(warmingPromises);

      // Contar éxitos y fallos
      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      this.logger.log(
        `✅ Hijos cacheados: ${successful} exitosos, ${failed} fallidos`,
      );

      if (failed > 0) {
        this.logger.warn(`⚠️ Algunas secretarías no pudieron pre-cachearse`);
      }
    } catch (error) {
      this.logger.error(
        `Error pre-cacheando hijos de secretarías: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Pre-cachea los hijos de una secretaría específica
   */
  private async warmSecretariaChildren(secretariaId: string): Promise<void> {
    try {
      const children =
        await this.publicOrganigramService.getSecretariaChildren(secretariaId);

      // Usar el helper para generar la key exacta que usará el interceptor
      const cacheKey = CacheKeys.secretariaChildren(secretariaId);
      await this.cacheManager.set(cacheKey, children, this.TTL);

      this.logger.debug(
        `  ✓ Secretaría ${secretariaId}: ${children.length} descendientes cacheados`,
      );
    } catch (error) {
      this.logger.error(
        `  ✗ Error cacheando secretaría ${secretariaId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Limpia todo el cache público
   */
  async clearPublicCache(): Promise<void> {
    try {
      this.logger.log('🧹 Limpiando cache público...');
      await this.cacheManager.clear();
      this.logger.log('✅ Cache público limpiado');
    } catch (error) {
      this.logger.error(`Error limpiando cache: ${error.message}`);
      throw error;
    }
  }

  /**
   * Limpia y recarga el cache (útil al activar nueva versión)
   */
  async refreshPublicCache(): Promise<void> {
    this.logger.log('🔄 Refrescando cache público...');
    await this.clearPublicCache();
    await this.warmPublicOrganigramCache();
    this.logger.log('✅ Cache público refrescado');
  }

  /**
   * Limpia y recarga TODO el cache (público + estructura completa)
   */
  async refreshAllCache(organigramVersionsService: any): Promise<void> {
    this.logger.log('🔄 Refrescando TODO el cache...');
    await this.clearPublicCache();
    await this.warmAllCache(organigramVersionsService);
    this.logger.log('✅ TODO el cache refrescado');
  }
}
