import { 
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnprocessableEntityException
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

/**
 * Servicio para manejar de forma centralizada los errores de Prisma
 * y convertirlos en excepciones HTTP apropiadas.
 */
export class PrismaErrorHandler {
  private static readonly logger = new Logger('PrismaErrorHandler');

  /**
   * Maneja errores de Prisma y los transforma en excepciones HTTP
   * @param error Error de Prisma o cualquier otro error
   * @param context Contexto adicional para el log (opcional)
   */
  static handleError(error: any, context: string = 'DB Operation'): never {
    // Si ya es un error de Prisma conocido
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handleKnownError(error, context);
    }
    
    // Si es un error de validación de Prisma
    if (error instanceof Prisma.PrismaClientValidationError) {
      PrismaErrorHandler.logger.error(
        `Error de validación en ${context}: ${error.message}`, 
        error.stack
      );
      throw new BadRequestException('Error en los datos proporcionados');
    }
    
    // Si es un error de inicialización de Prisma
    if (error instanceof Prisma.PrismaClientInitializationError) {
      PrismaErrorHandler.logger.error(
        `Error de inicialización de BD en ${context}: ${error.message}`, 
        error.stack
      );
      throw new InternalServerErrorException('Error al conectar con la base de datos');
    }

    // Si es un error de consulta en crudo (raw query)
    if (error instanceof Prisma.PrismaClientRustPanicError) {
      PrismaErrorHandler.logger.error(
        `Error crítico en Prisma en ${context}: ${error.message}`, 
        error.stack
      );
      throw new InternalServerErrorException('Error interno en la consulta a la base de datos');
    }

    // Para cualquier otro tipo de error
    PrismaErrorHandler.logger.error(
      `Error no identificado en ${context}: ${error.message || error}`, 
      error.stack
    );
    throw new InternalServerErrorException('Error inesperado en la operación de base de datos');
  }

  /**
   * Maneja errores conocidos de Prisma basados en su código
   */
  private static handleKnownError(
    error: Prisma.PrismaClientKnownRequestError,
    context: string
  ): never {
    // Log detallado del error para debugging
    this.logger.error(
      `Error de Prisma en ${context}: ${error.code} - ${error.message}`,
      { 
        code: error.code, 
        meta: error.meta, 
        stacktrace: error.stack 
      }
    );
    
    // Manejo según código de error de Prisma
    // Documentación: https://www.prisma.io/docs/reference/api-reference/error-reference
    switch (error.code) {
      // Errores de no encontrado
      case 'P2001': // Record does not exist
      case 'P2018': // Required relation does not exist
      case 'P2025': // Record not found
        throw new NotFoundException(this.getCustomMessage(error) || 'El recurso solicitado no existe');
      
      // Errores de unicidad
      case 'P2002': // Unique constraint failed
        const field = this.getTargetFromMeta(error);
        throw new ConflictException(
          this.getCustomMessage(error) || 
          `Ya existe un registro con el mismo valor de ${field || 'un campo único'}`
        );
      
      // Errores de clave foránea
      case 'P2003': // Foreign key constraint failed
      case 'P2014': // Relation constraint failed
      case 'P2015': // Related record not found
        throw new BadRequestException(
          this.getCustomMessage(error) || 
          'Error de relación: El registro relacionado no existe'
        );
      
      // Errores de consulta
      case 'P2005': // Value invalid for type
      case 'P2006': // Value out of range for type
      case 'P2008': // Query parsing error
      case 'P2009': // Query validation error
      case 'P2010': // Raw query error
      case 'P2011': // Null constraint violation
      case 'P2012': // Missing required value
      case 'P2013': // Missing required argument
      case 'P2019': // Input error
      case 'P2020': // Value out of range for type
        throw new BadRequestException(
          this.getCustomMessage(error) || 
          'Los datos proporcionados son inválidos o incompletos'
        );
      
      // Errores de tipo
      case 'P2007': // Type mismatch
      case 'P2016': // Query interpretation error
      case 'P2017': // Records for relation not connected
        throw new UnprocessableEntityException(
          this.getCustomMessage(error) || 
          'Error en el formato de los datos'
        );
      
      // Errores de conexión
      case 'P1000': // Authentication failed
      case 'P1001': // Cannot connect to database
      case 'P1002': // Database server terminated
      case 'P1003': // Database does not exist
      case 'P1008': // Operations timed out
        throw new InternalServerErrorException(
          'Error de conexión con la base de datos'
        );
      
      // Errores por defecto
      default:
        throw new InternalServerErrorException(
          'Error interno en la operación de base de datos'
        );
    }
  }
  
  /**
   * Intenta extraer nombres de campos desde el meta de error de Prisma
   */
  private static getTargetFromMeta(error: Prisma.PrismaClientKnownRequestError): string | null {
    const meta = error.meta;
    
    if (meta && 'target' in meta && Array.isArray(meta.target)) {
      return meta.target.join(', ');
    }
    
    return null;
  }
  
  /**
   * Extrae mensaje personalizado más amigable del error
   */
  private static getCustomMessage(error: Prisma.PrismaClientKnownRequestError): string | null {
    // Intenta extraer información específica del mensaje de error
    if (error.message) {
      // Para errores de columna que no existe
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        const match = error.message.match(/column\s+["'](.+?)["']\s+does not exist/i);
        if (match && match[1]) {
          return `La columna '${match[1]}' no existe en la base de datos`;
        }
      }
      
      // Para errores de tabla que no existe
      if (error.message.includes('table') && error.message.includes('does not exist')) {
        const match = error.message.match(/table\s+["'](.+?)["']\s+does not exist/i);
        if (match && match[1]) {
          return `La tabla '${match[1]}' no existe en la base de datos`;
        }
      }
    }
    
    return null;
  }
}