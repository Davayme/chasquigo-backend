import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { 
  ApiOperation, 
  ApiResponse, 
  ApiConsumes, 
  ApiBody,
  ApiTags 
} from '@nestjs/swagger';
import { AwsService } from './aws.service';

// Esquema para el body de la petición con archivo
const FileUploadDto = {
  type: 'object',
  properties: {
    image: {
      type: 'string',
      format: 'binary',
      description: 'Archivo de imagen (JPG, PNG, PDF)',
    },
  },
  required: ['image'],
};

@ApiTags('AWS - Validación de Documentos')
@Controller('aws')
export class AwsController {
  constructor(private readonly awsService: AwsService) {}

  @Post('validate-id-card')
  @ApiOperation({ 
    summary: 'Validar si una imagen es una cédula válida',
    description: 'Sube una imagen de cédula para validar si es un documento de identidad válido usando AWS Rekognition'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Imagen de la cédula a validar',
    schema: FileUploadDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Validación completada exitosamente',
    schema: {
      type: 'object',
      properties: {
        isValidIdCard: { type: 'boolean', example: true },
        confidence: { type: 'number', example: 85.5 },
        detectedLabels: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['Document', 'ID Card', 'Text', 'Paper']
        },
        extractedText: {
          type: 'array',
          items: { type: 'string' },
          example: ['REPÚBLICA DEL ECUADOR', 'CÉDULA DE IDENTIDAD']
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Imagen no proporcionada o error en el procesamiento' 
  })
  @UseInterceptors(FileInterceptor('image', {
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
        return cb(new BadRequestException('Solo se permiten archivos JPG, PNG o PDF'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB límite
    },
  }))
  async validateIdCard(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ninguna imagen');
    }

    const result = await this.awsService.validateIdCard(file.buffer);
    return {
      message: 'Validación completada exitosamente',
      data: result,
    };
  }

  @Post('validate-age')
  @ApiOperation({ 
    summary: 'Validar edad y tipo de documento',
    description: 'Extrae información de edad del documento y determina si es menor de edad, tercera edad o carnet de discapacidad'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Imagen del documento para extraer información de edad',
    schema: FileUploadDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Validación de edad completada exitosamente',
    schema: {
      type: 'object',
      properties: {
        isMinor: { type: 'boolean', example: false },
        isSenior: { type: 'boolean', example: false },
        isDisabilityCard: { type: 'boolean', example: false },
        birthDate: { type: 'string', example: '15/03/1990' },
        age: { type: 'number', example: 33 }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Imagen no proporcionada o error en el procesamiento' 
  })
  @UseInterceptors(FileInterceptor('image', {
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
        return cb(new BadRequestException('Solo se permiten archivos JPG, PNG o PDF'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB límite
    },
  }))
  async validateAge(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ninguna imagen');
    }

    const result = await this.awsService.validateAge(file.buffer);
    return {
      message: 'Validación de edad completada exitosamente',
      data: result,
    };
  }

  @Post('validate-document')
  @ApiOperation({ 
    summary: 'Validación completa del documento',
    description: 'Realiza una validación completa: verifica si es un documento válido Y extrae información de edad'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Imagen del documento para validación completa',
    schema: FileUploadDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Validación completa exitosa',
    schema: {
      type: 'object',
      properties: {
        documentValidation: {
          type: 'object',
          properties: {
            isValidIdCard: { type: 'boolean', example: true },
            confidence: { type: 'number', example: 85.5 },
            detectedLabels: { 
              type: 'array', 
              items: { type: 'string' },
              example: ['Document', 'ID Card', 'Text']
            },
            extractedText: {
              type: 'array',
              items: { type: 'string' },
              example: ['REPÚBLICA DEL ECUADOR', 'CÉDULA DE IDENTIDAD']
            }
          }
        },
        ageValidation: {
          type: 'object',
          properties: {
            isMinor: { type: 'boolean', example: false },
            isSenior: { type: 'boolean', example: false },
            isDisabilityCard: { type: 'boolean', example: false },
            birthDate: { type: 'string', example: '15/03/1990' },
            age: { type: 'number', example: 33 }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Imagen no proporcionada o error en el procesamiento' 
  })
  @UseInterceptors(FileInterceptor('image', {
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
        return cb(new BadRequestException('Solo se permiten archivos JPG, PNG o PDF'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB límite
    },
  }))
  async validateDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ninguna imagen');
    }

    const result = await this.awsService.validateDocument(file.buffer);
    return {
      message: 'Validación completa exitosa',
      data: result,
    };
  }
}