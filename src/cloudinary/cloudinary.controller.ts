import { Controller, Post, UploadedFile, UseInterceptors, HttpStatus } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('cloudinary')
@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('pdf')
  @ApiOperation({ 
    summary: 'Subir un archivo PDF a Cloudinary', 
    description: 'Endpoint para cargar archivos PDF a Cloudinary y obtener su URL segura' 
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo PDF a subir (máx. 10MB)',
        },
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'PDF subido exitosamente',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example: 'https://res.cloudinary.com/tu-cuenta/archivos/archivo.pdf'
        }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Formato de archivo no soportado o archivo muy grande' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Error al procesar el archivo' 
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(@UploadedFile() file: Express.Multer.File) {
    return this.cloudinaryService.uploadPdf(file);
  }

  @Post('image')
  @ApiOperation({ 
    summary: 'Subir una imagen a Cloudinary', 
    description: 'Endpoint para cargar imágenes a Cloudinary y obtener su URL segura' 
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Imagen a subir (máx. 1MB)',
        },
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Imagen subida exitosamente',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example: 'https://res.cloudinary.com/tu-cuenta/imagenes/imagen.jpg'
        }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Formato de archivo no soportado o archivo muy grande' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Error al procesar el archivo' 
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const result = await this.cloudinaryService.uploadImage(file);
    return { url: result.secure_url };
  }
}
