import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-error-filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug', 'log', 'verbose'],
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