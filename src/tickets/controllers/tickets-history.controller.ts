import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  ParseIntPipe, 
  Query, 
  Body,
  UseGuards,
  BadRequestException
} from "@nestjs/common";
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery,
  ApiBearerAuth,
  ApiBody
} from '@nestjs/swagger';
import { TicketsHistoryService } from "../services/tickets-history.service";
import { TicketHistoryResponse, TicketHistoryItem } from "../dto/ticket-history.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

@ApiTags('📋 Historial de Tickets')
@Controller("tickets-history")
export class TicketsHistoryController {
  constructor(private readonly ticketsHistoryService: TicketsHistoryService) {}

  @Get('user/:userId')
/*   @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() */
  @ApiOperation({
    summary: '📋 Obtener historial completo de tickets de un usuario',
    description: 'Devuelve todas las compras de tickets realizadas por un usuario, con opción de incluir QR codes.'
  })
  @ApiParam({ 
    name: 'userId', 
    description: 'ID del usuario', 
    type: 'number',
    example: 1
  })
  @ApiQuery({ 
    name: 'includeQR', 
    description: 'Incluir códigos QR en base64 para cada ticket', 
    required: false, 
    type: 'boolean',
    example: false
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de tickets obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        totalTickets: { type: 'number', example: 5 },
        tickets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              purchaseDate: { type: 'string', example: '2025-06-29T16:45:00.000Z' },
              totalAmount: { type: 'number', example: 86.25 },
              status: { type: 'string', example: 'completed' },
              paymentMethod: { type: 'string', example: 'Stripe' },
              ticket: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  qrCode: { type: 'string', example: 'TKT_1_1719368400000_abc12345' },
                  qrBase64: { type: 'string', example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...' },
                  status: { type: 'string', example: 'CONFIRMED' },
                  passengerCount: { type: 'number', example: 2 },
                  routeInfo: {
                    type: 'object',
                    properties: {
                      originCity: { type: 'string', example: 'Quito' },
                      destinationCity: { type: 'string', example: 'Guayaquil' },
                      departureTime: { type: 'string', example: '08:00:00' },
                      date: { type: 'string', example: '2025-06-29' }
                    }
                  }
                }
              },
              passengers: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', example: 1 },
                    passengerName: { type: 'string', example: 'Juan Pérez' },
                    seatNumber: { type: 'string', example: '12' },
                    seatType: { type: 'string', example: 'VIP' },
                    passengerType: { type: 'string', example: 'ADULT' },
                    finalPrice: { type: 'number', example: 43.12 }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async getUserTicketHistory(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('includeQR') includeQR?: string
  ): Promise<TicketHistoryResponse> {
    const shouldIncludeQR = includeQR === 'true';
    return this.ticketsHistoryService.getUserTicketHistory(userId, shouldIncludeQR);
  }

  @Get('ticket/:ticketId')
/*   @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() */
  @ApiOperation({
    summary: '🎫 Obtener ticket específico con QR code',
    description: 'Devuelve la información completa de un ticket específico incluyendo su código QR en base64.'
  })
  @ApiParam({ 
    name: 'ticketId', 
    description: 'ID del ticket', 
    type: 'number',
    example: 1
  })
  @ApiQuery({ 
    name: 'userId', 
    description: 'ID del usuario (opcional, para filtrar por propietario)', 
    required: false, 
    type: 'number',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket obtenido exitosamente con QR code',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        purchaseDate: { type: 'string', example: '2025-06-29T16:45:00.000Z' },
        totalAmount: { type: 'number', example: 86.25 },
        status: { type: 'string', example: 'completed' },
        paymentMethod: { type: 'string', example: 'Stripe' },
        ticket: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            qrCode: { type: 'string', example: 'TKT_1_1719368400000_abc12345' },
            qrBase64: { type: 'string', example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...' },
            status: { type: 'string', example: 'CONFIRMED' },
            passengerCount: { type: 'number', example: 2 }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  async getTicketWithQR(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Query('userId') userId?: string
  ): Promise<TicketHistoryItem | null> {
    // Convertir userId a número si se proporciona, sino undefined
    const userIdNumber = userId ? parseInt(userId, 10) : undefined;
    
    // Validar que si se proporciona userId, sea un número válido
    if (userId && isNaN(userIdNumber!)) {
      throw new BadRequestException('userId debe ser un número válido');
    }
    
    return this.ticketsHistoryService.getTicketWithQR(ticketId, userIdNumber);
  }

  @Get('qr/:ticketId')
/*   @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() */
  @ApiOperation({
    summary: '📱 Generar código QR para un ticket',
    description: 'Genera y devuelve únicamente el código QR en formato base64 para un ticket específico.'
  })
  @ApiParam({ 
    name: 'ticketId', 
    description: 'ID del ticket', 
    type: 'number',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'QR code generado exitosamente',
    schema: {
      type: 'object',
      properties: {
        ticketId: { type: 'number', example: 1 },
        qrBase64: { type: 'string', example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...' },
        generatedAt: { type: 'string', example: '2025-06-29T16:45:00.000Z' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  async generateTicketQR(@Param('ticketId', ParseIntPipe) ticketId: number) {
    const qrBase64 = await this.ticketsHistoryService.generateQRForTicket(ticketId);
    
    return {
      ticketId,
      qrBase64,
      generatedAt: new Date().toISOString()
    };
  }

  @Post('validate-qr')
  @ApiOperation({
    summary: '✅ Validar ticket por código QR',
    description: 'Valida un ticket escaneando su código QR. Marca el ticket como abordado si es válido.'
  })
  @ApiBody({
    description: 'Datos del código QR escaneado',
    schema: {
      type: 'object',
      properties: {
        qrData: { 
          type: 'string', 
          description: 'Datos JSON del código QR escaneado',
          example: '{"ticketId":1,"qrCode":"TKT_1_1719368400000_abc12345","passengers":[...],"route":{...},"verification":{...}}'
        }
      },
      required: ['qrData']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Validación completada',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Ticket válido - Puede abordar' },
        ticket: { 
          type: 'object',
          description: 'Datos del ticket (solo si es válido)'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos de QR inválidos' })
  async validateTicketQR(@Body('qrData') qrData: string) {
    if (!qrData) {
      throw new BadRequestException('Datos de QR requeridos');
    }

    return this.ticketsHistoryService.validateTicketByQR(qrData);
  }
}