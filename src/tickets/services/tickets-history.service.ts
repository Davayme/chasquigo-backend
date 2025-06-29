import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { TicketHistoryItem, TicketHistoryResponse, QRValidationResult } from "../dto/ticket-history.dto";
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';

@Injectable()
export class TicketsHistoryService {
  private readonly logger = new Logger(TicketsHistoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 📋 OBTENER HISTORIAL COMPLETO DE TICKETS DE UN USUARIO
   */
  async getUserTicketHistory(userId: number, includeQR: boolean = false): Promise<TicketHistoryResponse> {
    try {
      this.logger.log(`📋 Obteniendo historial de tickets para usuario: ${userId}`);

      // Obtener todas las transacciones de compra del usuario
      const purchaseTransactions = await this.prisma.purchaseTransaction.findMany({
        where: {
          buyerUserId: userId,
          isDeleted: false,
        },
        include: {
          tickets: {
            where: { isDeleted: false },
            include: {
              ticketPassengers: {
                where: { isDeleted: false },
                include: {
                  passenger: {
                    select: {
                      firstName: true,
                      lastName: true,
                      idNumber: true,
                    },
                  },
                  seat: {
                    select: {
                      number: true,
                      type: true,
                    },
                  },
                },
              },
              Frequency: {
                include: {
                  originCity: {
                    select: { name: true },
                  },
                  destinationCity: {
                    select: { name: true },
                  },
                },
              },
            },
          },
          payment: {
            select: {
              method: true,
              status: true,
            },
          },
        },
        orderBy: {
          purchaseDate: 'desc',
        },
      });

      this.logger.log(`📊 Encontradas ${purchaseTransactions.length} transacciones para usuario ${userId}`);

      // Procesar cada transacción y generar QR si se solicita
      const tickets: TicketHistoryItem[] = [];
      
      for (const transaction of purchaseTransactions) {
        this.logger.debug(`🔍 Procesando transacción ${transaction.id} con ${transaction.tickets.length} tickets`);
        
        const ticket = transaction.tickets[0]; // Cada transacción tiene un ticket grupal
        
        // ✅ VALIDACIÓN: Verificar que existe el ticket
        if (!ticket) {
          this.logger.warn(`⚠️ Transacción ${transaction.id} no tiene tickets asociados, omitiendo...`);
          continue;
        }

        // ✅ VALIDACIÓN: Verificar que tiene datos de frecuencia
        if (!ticket.Frequency) {
          this.logger.warn(`⚠️ Ticket ${ticket.id} no tiene información de frecuencia, omitiendo...`);
          continue;
        }
        
        let qrBase64: string | undefined;
        if (includeQR && ticket.qrCode) {
          try {
            qrBase64 = await this.generateQRForTicket(ticket.id);
          } catch (error) {
            this.logger.warn(`No se pudo generar QR para ticket ${ticket.id}: ${error.message}`);
          }
        }

        const ticketHistoryItem: TicketHistoryItem = {
          id: transaction.id,
          purchaseDate: transaction.purchaseDate.toISOString(),
          totalAmount: parseFloat(transaction.finalAmount.toString()),
          status: transaction.status,
          paymentMethod: transaction.payment?.method || 'unknown',
          ticket: {
            id: ticket.id,
            qrCode: ticket.qrCode || '',
            qrBase64,
            status: ticket.status,
            passengerCount: ticket.passengerCount,
            routeInfo: {
              originCity: ticket.Frequency.originCity?.name || 'N/A',
              destinationCity: ticket.Frequency.destinationCity?.name || 'N/A',
              departureTime: ticket.Frequency.departureTime?.toTimeString() || '00:00:00',
              date: transaction.purchaseDate.toISOString().split('T')[0],
            },
          },
          passengers: ticket.ticketPassengers?.map((tp) => ({
            id: tp.id,
            passengerName: `${tp.passenger.firstName} ${tp.passenger.lastName}`,
            seatNumber: tp.seat.number.toString(),
            seatType: tp.seatType.toString(),
            passengerType: tp.passengerType.toString(),
            finalPrice: parseFloat(tp.finalPrice.toString()),
          })) || [],
        };

        tickets.push(ticketHistoryItem);
      }

      this.logger.log(`✅ Historial obtenido: ${tickets.length} tickets encontrados`);

      return {
        totalTickets: tickets.length,
        tickets,
      };
    } catch (error) {
      this.logger.error(`❌ Error obteniendo historial de usuario ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 🎫 OBTENER TICKET ESPECÍFICO CON QR
   */
  async getTicketWithQR(ticketId: number, userId?: number): Promise<TicketHistoryItem | null> {
    try {
      this.logger.log(`🎫 Obteniendo ticket ${ticketId} con QR`);

      const ticket = await this.prisma.ticket.findFirst({
        where: {
          id: ticketId,
          isDeleted: false,
          ...(userId && { buyerUserId: userId }), // Filtrar por usuario si se proporciona
        },
        include: {
          purchaseTransaction: {
            include: {
              payment: {
                select: {
                  method: true,
                  status: true,
                },
              },
            },
          },
          ticketPassengers: {
            where: { isDeleted: false },
            include: {
              passenger: {
                select: {
                  firstName: true,
                  lastName: true,
                  idNumber: true,
                },
              },
              seat: {
                select: {
                  number: true,
                  type: true,
                },
              },
            },
          },
          Frequency: {
            include: {
              originCity: {
                select: { name: true },
              },
              destinationCity: {
                select: { name: true },
              },
            },
          },
        },
      });

      if (!ticket) {
        throw new NotFoundException(`Ticket ${ticketId} no encontrado`);
      }

      // Generar QR
      const qrBase64 = await this.generateQRForTicket(ticket.id);

      const response: TicketHistoryItem = {
        id: ticket.purchaseTransaction.id,
        purchaseDate: ticket.purchaseTransaction.purchaseDate.toISOString(),
        totalAmount: parseFloat(ticket.purchaseTransaction.finalAmount.toString()),
        status: ticket.purchaseTransaction.status,
        paymentMethod: ticket.purchaseTransaction.payment?.method || 'unknown',
        ticket: {
          id: ticket.id,
          qrCode: ticket.qrCode || '',
          qrBase64,
          status: ticket.status,
          passengerCount: ticket.passengerCount,
          routeInfo: {
            originCity: ticket.Frequency.originCity.name,
            destinationCity: ticket.Frequency.destinationCity.name,
            departureTime: ticket.Frequency.departureTime.toTimeString(),
            date: ticket.purchaseTransaction.purchaseDate.toISOString().split('T')[0],
          },
        },
        passengers: ticket.ticketPassengers.map((tp) => ({
          id: tp.id,
          passengerName: `${tp.passenger.firstName} ${tp.passenger.lastName}`,
          seatNumber: tp.seat.number.toString(),
          seatType: tp.seatType.toString(),
          passengerType: tp.passengerType.toString(),
          finalPrice: parseFloat(tp.finalPrice.toString()),
        })),
      };

      this.logger.log(`✅ Ticket ${ticketId} obtenido con QR generado`);
      return response;
    } catch (error) {
      this.logger.error(`❌ Error obteniendo ticket ${ticketId}:`, error);
      throw error;
    }
  }

  /**
   * 🔍 GENERAR QR CODE PARA UN TICKET
   */
  async generateQRForTicket(ticketId: number): Promise<string> {
    try {
      // Obtener información completa del ticket
      const ticket = await this.prisma.ticket.findUnique({
        where: { id: ticketId, isDeleted: false },
        include: {
          purchaseTransaction: true,
          ticketPassengers: {
            include: {
              passenger: {
                select: {
                  firstName: true,
                  lastName: true,
                  idNumber: true,
                },
              },
              seat: {
                select: {
                  number: true,
                  type: true,
                },
              },
            },
          },
          Frequency: {
            include: {
              originCity: { select: { name: true } },
              destinationCity: { select: { name: true } },
            },
          },
          Bus: {
            select: {
              licensePlate: true,
            },
          },
        },
      });

      if (!ticket) {
        throw new NotFoundException(`Ticket ${ticketId} no encontrado`);
      }

      // Generar hash de seguridad
      const hash = this.generateTicketHash(ticket);

      // Construir datos para el QR
      const qrData = JSON.stringify({
        ticketId: ticket.id,
        qrCode: ticket.qrCode,
        passengers: ticket.ticketPassengers.map(tp => ({
          passengerId: tp.passenger.idNumber,
          passengerName: `${tp.passenger.firstName} ${tp.passenger.lastName}`,
          seatNumber: tp.seat.number,
          seatType: tp.seat.type,
        })),
        route: {
          origin: ticket.Frequency.originCity.name,
          destination: ticket.Frequency.destinationCity.name,
          date: ticket.purchaseTransaction.purchaseDate.toISOString().split('T')[0],
          time: ticket.Frequency.departureTime.toTimeString(),
          bus: ticket.Bus?.licensePlate || 'N/A',
        },
        verification: {
          hash: hash.substring(0, 16), // Usar solo parte del hash
          exp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
        },
      });

      // Generar QR code como base64
      return await this.generateQRCode(qrData);
    } catch (error) {
      this.logger.error(`❌ Error generando QR para ticket ${ticketId}:`, error);
      throw new Error(`Error al generar QR: ${error.message}`);
    }
  }

  /**
   * ✅ VALIDAR TICKET POR QR
   */
  async validateTicketByQR(qrData: string): Promise<QRValidationResult> {
    try {
      // Parsear datos del QR
      const data = JSON.parse(qrData);
      const { ticketId, verification } = data;

      if (!ticketId || !verification?.hash) {
        return {
          isValid: false,
          message: 'QR inválido: datos incompletos',
        };
      }

      // Verificar expiración
      if (new Date() > new Date(verification.exp)) {
        return {
          isValid: false,
          message: 'QR expirado',
        };
      }

      // Obtener ticket de la base de datos
      const ticket = await this.prisma.ticket.findUnique({
        where: { id: ticketId, isDeleted: false },
        include: {
          purchaseTransaction: true,
          ticketPassengers: {
            include: {
              passenger: true,
              seat: true,
            },
          },
        },
      });

      if (!ticket) {
        return {
          isValid: false,
          message: 'Ticket no encontrado',
        };
      }

      // Validar hash de seguridad
      const calculatedHash = this.generateTicketHash(ticket).substring(0, 16);
      if (calculatedHash !== verification.hash) {
        return {
          isValid: false,
          message: 'QR manipulado o inválido',
        };
      }

      // Verificar estado del ticket
      if (ticket.status !== 'CONFIRMED') {
        return {
          isValid: false,
          message: `Ticket en estado: ${ticket.status}`,
        };
      }

      // Marcar como validado/abordado si es válido
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'BOARDED' },
      });

      return {
        isValid: true,
        ticket: data,
        message: 'Ticket válido - Puede abordar',
      };
    } catch (error) {
      this.logger.error(`❌ Error validando QR:`, error);
      return {
        isValid: false,
        message: 'Error al validar QR',
      };
    }
  }

  /**
   * 🔧 GENERAR QR CODE COMO BASE64
   */
  private async generateQRCode(data: string): Promise<string> {
    try {
      const options = {
        errorCorrectionLevel: 'H' as const,
        type: 'image/png' as const,
        quality: 0.92,
        width: 300,
        margin: 2,
        color: {
          dark: '#1a365d', // Azul oscuro
          light: '#ffffff',
        },
      };

      const qrBase64 = await QRCode.toDataURL(data, options);
      this.logger.debug(`QR generado correctamente (${qrBase64.length} caracteres)`);
      return qrBase64;
    } catch (error) {
      this.logger.error(`Error generando QR:`, error);
      throw new Error(`Error al generar QR: ${error.message}`);
    }
  }

  /**
   * 🔐 GENERAR HASH DE SEGURIDAD PARA TICKET
   */
  private generateTicketHash(ticket: any): string {
    const secret = process.env.QR_SECRET || 'chasquigo-secret-key-2025';
    const data = `${ticket.id}-${ticket.buyerUserId}-${ticket.purchaseTransaction.id}-${ticket.purchaseTransaction.purchaseDate.toISOString()}`;
    
    return crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');
  }
}