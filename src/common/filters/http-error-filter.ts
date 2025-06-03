import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
    InternalServerErrorException
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const path = request.url;

        // Valores predeterminados
        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Ha ocurrido un error en el servidor';
        let error = 'Error del Servidor';
        let details = null;

        // Determinar ambiente
        const isDevelopment = process.env.NODE_ENV !== 'production';

        // Extraer información relevante según el tipo de excepción
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            
            // Obtener nombre del error basado en el estatus
            error = this.getErrorNameByStatus(status);

            // Procesar el mensaje de error
            if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                if ('message' in exceptionResponse) {
                    if (Array.isArray(exceptionResponse['message'])) {
                        message = (exceptionResponse['message'] as string[]).join(', ');
                    } else {
                        message = exceptionResponse['message'] as string;
                    }
                }
                
                // Usar el error personalizado si existe
                if ('error' in exceptionResponse && typeof exceptionResponse['error'] === 'string') {
                    error = exceptionResponse['error'];
                }
            } else if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            }
            
            // Para errores del servidor, dar mensajes simplificados en producción
            if (status >= 500 && !isDevelopment) {
                message = 'Ha ocurrido un error en el servidor. Por favor intente más tarde.';
            }
        } else if (exception instanceof Error) {
            // Para errores no HTTP, log completo pero respuesta genérica
            this.logger.error(`Error no HTTP: ${exception.message}`, exception.stack);
            
            if (isDevelopment) {
                message = exception.message;
                error = exception.name;
                details = exception.stack;
            }
        }

        // Log completo del error (solo backend)
        this.logger.error(`${error} en ${path}: ${message}`, 
            exception instanceof Error ? exception.stack : undefined);

        // Crear respuesta estandarizada
        const errorResponse: ErrorResponse = {
            statusCode: status,
            message: message,
            error: error,
            timestamp: new Date().toISOString(),
            path: path,
        };
        
        // Solo incluir detalles en desarrollo
        if (isDevelopment && details) {
            errorResponse.details = details;
        }

        // Enviar respuesta
        response.status(status).json(errorResponse);
    }
    
    // Obtener nombre descriptivo según el código de estado
    private getErrorNameByStatus(status: number): string {
        switch (status) {
            case HttpStatus.BAD_REQUEST: return 'Solicitud Incorrecta';
            case HttpStatus.UNAUTHORIZED: return 'No Autorizado';
            case HttpStatus.FORBIDDEN: return 'Acceso Prohibido';
            case HttpStatus.NOT_FOUND: return 'No Encontrado';
            case HttpStatus.CONFLICT: return 'Conflicto';
            case HttpStatus.UNPROCESSABLE_ENTITY: return 'Entidad No Procesable';
            case HttpStatus.INTERNAL_SERVER_ERROR: return 'Error del Servidor';
            case HttpStatus.BAD_GATEWAY: return 'Puerta de Enlace Incorrecta';
            case HttpStatus.SERVICE_UNAVAILABLE: return 'Servicio No Disponible';
            default: return `Error ${status}`;
        }
    }
}

interface ErrorResponse {
    statusCode: number;
    message: string;
    error: string;
    timestamp: string;
    path: string;
    details?: any;
}