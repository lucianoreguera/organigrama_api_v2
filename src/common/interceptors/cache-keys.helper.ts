/**
 * Helper centralizado para generar cache keys consistentes
 * Usado por el interceptor y por el cache warming service
 */
export class CacheKeys {
  private static readonly PREFIX = 'public:';

  /**
   * Genera la key para la lista de secretarías
   */
  static secretariasList(): string {
    return `${this.PREFIX}/api/v2/public/organigrama/secretarias`;
  }

  /**
   * Genera la key para los hijos de una secretaría específica
   */
  static secretariaChildren(secretariaId: string): string {
    return `${this.PREFIX}/api/v2/public/organigrama/secretarias/${secretariaId}/hijos`;
  }

  /**
   * Genera la key para la estructura completa del organigrama activo
   */
  static activeOrganigramStructure(): string {
    return `${this.PREFIX}/api/v2/organigrams_version/active/structure`;
  }

  /**
   * Genera una cache key genérica basada en ruta y parámetros
   * Usado por el interceptor HTTP
   */
  static fromRoute(routePath: string, params: any = {}): string {
    let key = routePath;

    // Reemplazar los parámetros en la ruta
    if (params && Object.keys(params).length > 0) {
      Object.entries(params).forEach(([paramName, paramValue]) => {
        key = key.replace(`:${paramName}`, String(paramValue));
      });
    }

    return `${this.PREFIX}${key}`;
  }
}
