import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-error-filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug', 'log', 'verbose'],
  });
  // Configurar el adaptador HTTP
  const httpAdapter = app.getHttpAdapter();
  const expressApp = httpAdapter.getInstance();
  
  // Configurar proxy
  expressApp.set('trust proxy', true);
  
  // Asegurar que el directorio de updates exista
  const updatesPath = join(process.cwd(), 'updates');
  const fs = await import('fs/promises');
  try {
    await fs.mkdir(updatesPath, { recursive: true });
    console.log(`Directorio de uploads configurado en: ${updatesPath}`);
  } catch (error) {
    console.error('Error al configurar el directorio de uploads:', error);
  }
  
  // Configurar archivos estáticos
  expressApp.use('/updates', express.static(updatesPath, {
    index: false,  // No permitir listado de directorios
    redirect: false // No permitir redirecciones
  }));
  
  // Middleware para loggear las peticiones a archivos estáticos
  expressApp.use('/updates', (req, res, next) => {
    console.log(`Solicitud a archivo estático: ${req.path}`);
    next();
  });

  // Habilitar CORS
  app.enableCors();

  // Configurar ValidationPipe global para validar DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Registrar el filtro de excepciones global
  app.useGlobalFilters(new HttpExceptionFilter());

  // Configuración mejorada de Swagger con autenticación JWT
  const config = new DocumentBuilder()
    .setTitle('Chasquigo API')
    .setDescription('API para la aplicación de reserva de boletos de cooperativas de transporte')
    .setVersion('1.0')
    .addBearerAuth(
      {
        description: 'Ingresa tu JWT token aquí',
        name: 'Authorization',
        bearerFormat: 'JWT',
        scheme: 'Bearer',
        type: 'http',
        in: 'header',
      },
      'JWT', // Este es el ID que se usará para referenciarlo en los decoradores @ApiBearerAuth()
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Añadimos opciones para la UI de Swagger
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, 
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      security: [{ JWT: [] }],
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  // Mostrar las rutas disponibles
  const serverUrl = `http://localhost:${port}`;
  console.log(`Servidor corriendo en ${serverUrl}`);
  console.log(`Documentación Swagger disponible en ${serverUrl}/api/docs`);
}
bootstrap().catch(err => {
  console.error('Error al iniciar la aplicación:', err);
});