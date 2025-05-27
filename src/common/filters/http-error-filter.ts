import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
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

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Error interno del servidor';
        let error = 'Error Interno';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                // Para excepciones con estructura como ValidationException
                if ('message' in exceptionResponse) {
                    if (Array.isArray(exceptionResponse['message'])) {
                        message = (exceptionResponse['message'] as string[]).join(', ');
                    } else {
                        message = exceptionResponse['message'] as string;
                    }
                }
                if ('error' in exceptionResponse) {
                    error = exceptionResponse['error'] as string;
                } else {
                    error = exception.name;
                }
            } else {
                message = exceptionResponse as string;
                error = exception.name;
            }
        } else if (exception instanceof Error) {
            message = exception.message;
            error = exception.name;
        }

        // Loguear el error completo para debugging
        this.logger.error(`${error}: ${message}`, exception instanceof Error ? exception.stack : undefined);

        // Respuesta estandarizada
        const errorResponse = new ErrorResponse(status, message, error, path);

        response.status(status).json(errorResponse);
    }
}

export class ErrorResponse {
    statusCode: number;
    message: string;
    error: string;
    timestamp: string;
    path: string;

    constructor(statusCode: number, message: string, error: string, path: string) {
        this.statusCode = statusCode;
        this.message = message;
        this.error = error;
        this.timestamp = new Date().toISOString();
        this.path = path;
    }
}