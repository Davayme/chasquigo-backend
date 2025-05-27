import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-error-filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
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
  
  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Chasquigo API')
    .setDescription('API para la aplicación de reserva de boletos de cooperativas de transporte')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  await app.listen(process.env.PORT ?? 3000);
  
  // Mostrar las rutas disponibles incluyendo Swagger
  const serverUrl = `http://localhost:${process.env.PORT ?? 3000}`;
  console.log(`Servidor iniciado en ${serverUrl}`);
  console.log(`Documentación Swagger disponible en ${serverUrl}/api/docs`);
}
bootstrap();