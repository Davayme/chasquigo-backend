// filepath: c:\Users\davay\Documents\Projects\Nestjs Projects\chasquigo-backend\src\main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-error-filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { 
    logger: ['error', 'warn', 'debug', 'log', 'verbose'], // Aumentar nivel de logs para debug
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
  
  // Configuración de Swagger con autenticación JWT
  const config = new DocumentBuilder()
    .setTitle('Chasquigo API')
    .setDescription('API para la aplicación de reserva de boletos de cooperativas de transporte')
    .setVersion('1.0')
    .addBearerAuth({ 
      type: 'http', 
      scheme: 'bearer', 
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Ingresa tu token JWT',
      in: 'header',
    }, 'access-token')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  console.log('Iniciando servidor NestJS...');
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  // Mostrar las rutas disponibles incluyendo Swagger
  const serverUrl = `http://localhost:${port}`;
  console.log(`Servidor iniciado en ${serverUrl}`);
  console.log(`Documentación Swagger disponible en ${serverUrl}/api/docs`);
}
bootstrap().catch(err => {
  console.error('Error al iniciar la aplicación:', err);
});