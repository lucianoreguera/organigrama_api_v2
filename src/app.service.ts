import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

export interface HealthStatus {
  status: string;
  timestamp: string;
}

export interface DbStatus {
  dbStatus: string;
}

@Injectable()
export class AppService {
  // Inyectamos la conexión de Mongoose para poder acceder a su estado.
  // NestJS se encarga de proveer esta conexión gracias al MongooseModule.
  constructor(@InjectConnection() private readonly connection: Connection) {}

  getHealth(): HealthStatus {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Verifica y devuelve el estado de la conexión a la base de datos MongoDB.
   * @returns {DbStatus} Un objeto indicando si la base de datos está conectada.
   */
  getDbStatus(): DbStatus {
    // La propiedad readyState de una conexión de Mongoose nos da el estado:
    // 0: disconnected
    // 1: connected
    // 2: connecting
    // 3: disconnecting
    const isConnected = this.connection.readyState === 1;

    return {
      dbStatus: isConnected ? 'OK' : 'Error: Not Connected',
    };
  }
}
