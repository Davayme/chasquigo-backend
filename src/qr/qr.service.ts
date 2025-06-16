import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QrService {
    private readonly logger = new Logger(QrService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Genera un código QR a partir de los datos proporcionados
     * @param data Datos para codificar en el QR
     * @returns Imagen QR en formato base64
     */
    async generateQRCode(data: string): Promise<string> {
        try {
            // Opciones para personalizar el QR
            const options = {
                errorCorrectionLevel: 'H' as const, // Alta corrección de errores
                type: 'image/png' as const,  // Tipo literal correcto
                quality: 0.92,
                width: 240,
                margin: 1,
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
     * Genera un QR para un boleto específico
     * @param ticketId ID del boleto
     * @param format Formato deseado del QR (base64 o png)
     * @returns QR como string base64 o como buffer PNG
     */
    async getTicketQR(ticketId: number, format: 'base64' | 'png' = 'base64'): Promise<string | Buffer> {
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
                },
                routeSheet: {
                    include: {
                        frequency: true,
                        bus: {
                            select: {
                                licensePlate: true
                            }
                        }
                    }
                },
                seat: true,
                originStop: true,
                destinationStop: true
            }
        });

        // Verificar si el boleto existe
        if (!ticket) {
            throw new NotFoundException(`Boleto con ID ${ticketId} no encontrado`);
        }

        // Generar hash de seguridad
        const hash = this.generateTicketHash(ticket);

        // Construir los datos para el QR
        const qrData = JSON.stringify({
            ticketId: ticket.id,
            passengerId: ticket.user.idNumber,
            passengerName: `${ticket.user.firstName} ${ticket.user.lastName}`,
            origin: ticket.originStop.name,
            destination: ticket.destinationStop.name,
            date: ticket.routeSheet.date.toISOString().split('T')[0],
            time: ticket.routeSheet.frequency.departureTime,
            bus: ticket.routeSheet.bus.licensePlate,
            seat: ticket.seat.number,
            hash: hash.substring(0, 16), // Usar solo parte del hash por seguridad y tamaño
            exp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Expiración de 24 horas
        });

        // Generar el QR en el formato solicitado
        if (format === 'png') {
            return await this.generateQRBuffer(qrData);
        } else {
            return await this.generateQRCode(qrData);
        }
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

    /////////////////////////////////
    
}