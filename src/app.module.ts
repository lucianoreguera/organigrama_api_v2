import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { JoiValidationSchema } from './config/joi.validation';
import { EnvConfiguration } from './config/env.config';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from './common/common.module';
import { LevelsModule } from './levels/levels.module';
import { SeedModule } from './seed/seed.module';
import { PeopleModule } from './people/people.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DepartmentsModule } from './departments/departments.module';
import { OrganigramsVersionModule } from './organigrams_version/organigrams_version.module';
import { AppsModule } from './apps/apps.module';
import { PublicOrganigramModule } from './public-organigram/public-organigram.module';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheWarmingService } from './public-organigram/cache-warming.service';
import { OrganigramVersionsService } from './organigrams_version/organigrams_version.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [EnvConfiguration],
      validationSchema: JoiValidationSchema,
    }),
    // Configuración de Cache
    CacheModule.register({
      isGlobal: true, // Hace que el cache esté disponible en toda la app
      ttl: 3600, // Tiempo de vida por defecto: 1 hora (en segundos)
      max: 100, // Máximo de items en cache
    }),
    MongooseModule.forRoot(process.env.MONGODB!, {
      dbName: 'organigrama',
    }),
    CommonModule,
    SeedModule,
    AuthModule,
    UsersModule,
    LevelsModule,
    PeopleModule,
    DepartmentsModule,
    OrganigramsVersionModule,
    AppsModule,
    PublicOrganigramModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  constructor(
    private readonly cacheWarmingService: CacheWarmingService,
    private readonly organigramVersionsService: OrganigramVersionsService,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 Inicializando aplicación...');

    // Cache warming BLOQUEANTE - espera a que termine antes de continuar
    try {
      // Warming completo: endpoints públicos + estructura activa
      await this.cacheWarmingService.warmAllCache(
        this.organigramVersionsService,
      );
      this.logger.log('✅ Aplicación lista para recibir peticiones');
    } catch (error) {
      this.logger.error(`❌ Error en cache warming inicial: ${error.message}`);
      // La app continúa aunque falle el warming
    }
  }
}
