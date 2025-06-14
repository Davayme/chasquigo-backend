import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QrDemoService {
    private readonly logger = new Logger(QrDemoService.name);

    constructor(private readonly prisma: PrismaService) { }

    async generateQRCode(data: string): Promise<string> {
        try {
            // Opciones para personalizar el QR
            const options = {
                errorCorrectionLevel: 'H' as const, // Alta corrección de errores
                type: 'image/png' as const,
                width: 240,
                margin: 1,
                quality: 0.92,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            };

            // Generar QR como string base64
            const qrBase64 = await QRCode.toDataURL(data, options);
            this.logger.debug(`QR generado correctamente (tamaño: ${qrBase64.length} bytes)`);
            return qrBase64;
        } catch (error) {
            this.logger.error(`Error al generar código QR: ${error.message}`, error.stack);
            throw new Error(`Error al generar código QR: ${error.message}`);
        }
    }

    /**
     * Genera un QR como un buffer PNG
     * @param data Datos para codificar en el QR
     * @returns Buffer con la imagen PNG
     */
    async generateQRBuffer(data: string): Promise<Buffer> {
        try {
            const buffer = await QRCode.toBuffer(data, {
                errorCorrectionLevel: 'H',
                type: 'png',
                width: 240,
                margin: 1
            });
            this.logger.debug(`QR Buffer generado correctamente (tamaño: ${buffer.length} bytes)`);
            return buffer;
        } catch (error) {
            this.logger.error(`Error al generar buffer QR: ${error.message}`, error.stack);
            throw new Error(`Error al generar buffer QR: ${error.message}`);
        }
    }
    /**
   * Genera un QR de prueba con datos estáticos (no requiere datos en la BD)
   * @param demoId ID demo para uso en pruebas (1-3 para diferentes escenarios)
   * @param format Formato deseado del QR (base64 o png)
   * @returns QR como string base64 o como buffer PNG
   */
    async getDemoTicketQR(demoId: number = 1, format: 'base64' | 'png' = 'base64'): Promise<string | Buffer> {
        // Crear datos estáticos en función del demoId
        const demoData = this.createDemoTicketData(demoId);

        // Generar hash de seguridad con los datos demo
        const hash = this.generateDemoTicketHash(demoData);

        // Construir los datos para el QR
        const qrData = JSON.stringify({
            ticketId: demoData.id,
            passengerId: demoData.passengerIdNumber,
            passengerName: demoData.passengerName,
            origin: demoData.originStop,
            destination: demoData.destinationStop,
            date: demoData.travelDate,
            time: demoData.departureTime,
            bus: demoData.busLicensePlate,
            seat: demoData.seatNumber,
            hash: hash.substring(0, 16),
            exp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

        this.logger.debug(`Generando QR DEMO (ID: ${demoId}) con datos: ${JSON.stringify(demoData)}`);

        // Generar el QR en el formato solicitado
        if (format === 'png') {
            return await this.generateQRBuffer(qrData);
        } else {
            return await this.generateQRCode(qrData);
        }
    }

    /**
     * Crea datos demo para un boleto ficticio
     * @param demoId ID del escenario demo (1-3)
     * @returns Objeto con datos de boleto para test
     */
    private createDemoTicketData(demoId: number): any {
        // Definir algunos escenarios de datos demo
        const demoScenarios = [
            {
                id: 101,
                userId: 1001,
                seatId: 25,
                passengerIdNumber: "1720134567",
                passengerName: "Juan Pérez Gómez",
                originStop: "Quito",
                destinationStop: "Guayaquil",
                travelDate: "2025-06-15",
                departureTime: "08:30",
                busLicensePlate: "ABC-123",
                seatNumber: "P1F02A",
                purchaseDate: new Date().toISOString()
            },
            {
                id: 102,
                userId: 1002,
                seatId: 15,
                passengerIdNumber: "0987654321",
                passengerName: "María López Castro",
                originStop: "Guayaquil",
                destinationStop: "Cuenca",
                travelDate: "2025-06-16",
                departureTime: "10:15",
                busLicensePlate: "XYZ-789",
                seatNumber: "P1F03B",
                purchaseDate: new Date().toISOString()
            },
            {
                id: 103,
                userId: 1003,
                seatId: 42,
                passengerIdNumber: "1234567890",
                passengerName: "Carlos Rodríguez Benítez",
                originStop: "Cuenca",
                destinationStop: "Loja",
                travelDate: "2025-06-17",
                departureTime: "15:45",
                busLicensePlate: "DEF-456",
                seatNumber: "P2F01C",
                purchaseDate: new Date().toISOString()
            }
        ];

        // Ajustar el índice para evitar errores si se proporciona un ID fuera de rango
        const idx = ((demoId - 1) % 3 + 3) % 3;
        return demoScenarios[idx];
    }

    /**
     * Genera un hash para datos de billete demo
     * @param demoData Datos demo del boleto
     * @returns Hash HMAC-SHA256
     */
    private generateDemoTicketHash(demoData: any): string {
        const secret = process.env.QR_SECRET || 'chasquigo-demo-secret-key';
        return crypto
            .createHmac('sha256', secret)
            .update(`${demoData.id}-${demoData.userId}-${demoData.seatId}-${demoData.purchaseDate}`)
            .digest('hex');
    }

    /**
     * Valida un boleto escaneado usando su ID y hash
     * @param ticketId ID del boleto
     * @param hash Hash de validación del QR
     * @returns Objeto con información de validación
     */
    async validateTicket(ticketId: number, hash: string): Promise<{
        isValid: boolean;
        ticketId: number;
        passengerName: string;
        status: string;
        message: string;
    }> {
        try {
            // Buscar el boleto en la base de datos
            const ticket = await this.prisma.ticket.findUnique({
                where: { id: ticketId, isDeleted: false },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            idNumber: true
                        }
                    }
                }
            });

            // Verificar si el boleto existe
            if (!ticket) {
                throw new NotFoundException(`Boleto con ID ${ticketId} no encontrado`);
            }

            // Generar hash para comparar
            const calculatedHash = this.generateTicketHash(ticket).substring(0, 16);

            // Verificar si el hash coincide
            const isValid = calculatedHash === hash;

            // Actualizar estado del boleto a "validado" si es válido
            if (isValid && ticket.status !== 'validado') {
                await this.prisma.ticket.update({
                    where: { id: ticketId },
                    data: { status: 'validado' }
                });
            }

            return {
                isValid,
                ticketId: ticket.id,
                passengerName: `${ticket.user.firstName} ${ticket.user.lastName}`,
                status: isValid ? 'valid' : 'invalid',
                message: isValid
                    ? 'Boleto válido. Puede abordar.'
                    : 'Boleto inválido o manipulado.'
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Error al validar boleto: ${error.message}`, error.stack);
            throw new Error(`Error al validar boleto: ${error.message}`);
        }
    }

    /**
     * Valida un boleto demo (siempre devuelve resultado positivo)
     * @param demoId ID del boleto demo
     * @param hash Hash de validación
     * @returns Objeto con información de validación
     */
    validateDemoTicket(demoId: number, hash: string): {
        isValid: boolean;
        ticketId: number;
        passengerName: string;
        status: string;
        message: string;
    } {
        // Crear datos demo para validación
        const demoData = this.createDemoTicketData(demoId);

        // Para propósitos de demo, consideramos válido si el hash tiene al menos 8 caracteres
        const isValidHash = hash && hash.length >= 8;

        return {
            isValid: isValidHash,
            ticketId: demoData.id,
            passengerName: demoData.passengerName,
            status: isValidHash ? 'valid' : 'invalid',
            message: isValidHash
                ? 'Boleto de prueba válido. Puede abordar.'
                : 'Boleto de prueba inválido o manipulado.'
        };
    }

    /**
     * Genera un hash seguro para un boleto
     * @param ticket Objeto del boleto
     * @returns Hash HMAC-SHA256
     */
    private generateTicketHash(ticket: any): string {
        const secret = process.env.QR_SECRET || 'chasquigo-secret-key';
        return crypto
            .createHmac('sha256', secret)
            .update(`${ticket.id}-${ticket.userId}-${ticket.seatId}-${ticket.purchaseDate.toISOString()}`)
            .digest('hex');
    }
}