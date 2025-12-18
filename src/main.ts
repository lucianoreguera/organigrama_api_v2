import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar límites de payload
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.setGlobalPrefix('api/v2');

  app.enableCors({
    origin: '*', // Permite cualquier origen
    credentials: false,
    // methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // Permite cualquier método
    // allowedHeaders: '*', //['Content-Type', 'Authorization'], // Permite encabezados especificos
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  });

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Organigrama Municipal')
    .setDescription('Documentación de la API REST')
    .setVersion('2.0')
    // .addTag('usuarios', 'Operaciones relacionadas con usuarios')
    // .addTag('productos', 'Operaciones relacionadas con productos')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa tu token JWT',
        in: 'header',
      },
      'JWT-auth', // Este nombre se usa en los decoradores
    )
    // Configuración para la API KEY
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'API Key para aplicaciones externas',
      },
      'api-key',
    )
    .addServer('http://localhost:3000', 'Desarrollo')
    .addServer('https://apis.v1.cc.gob.ar/api_organigrama', 'Producción')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Configurar la ruta de Swagger
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'API Organigrama Municipal - Documentación',
    customfavIcon: 'https://farmacia.cc.gob.ar/img/favicon.png',
    // customJs: [
    //   'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
    //   'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    // ],
    // customCssUrl: [
    //   'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    // ],
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
