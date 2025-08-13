import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
    origin: true, // Permite cualquier origen
    credentials: true, // Puede enviar cookies/tokens
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Permite métodos especificos
    allowedHeaders: '*', //['Content-Type', 'Authorization'], // Permite encabezados especificos
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
    .addServer('http://localhost:3000', 'Desarrollo')
    // .addServer('https://mi-api.com', 'Producción')
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
