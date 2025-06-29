import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Headers,
  RawBody,
  BadRequestException,
  Req,
  Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { InitiatePurchaseDto } from '../tickets/dto/req/passenger-data.dto';
import { ConfirmCashPaymentDto } from './dto/req/confirm-cash.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('🎫 Tickets - Sistema de Compra')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) { }

  @Post('initiate-purchase')
  @ApiOperation({
    summary: '🚀 Iniciar proceso de compra de tickets',
    description: 'Inicia el proceso de compra creando la transacción y tickets en estado PENDING. Funciona tanto para pagos con Stripe como en efectivo.'
  })
  @ApiBody({ type: InitiatePurchaseDto })
  @ApiResponse({
    status: 201,
    description: 'Compra iniciada exitosamente',
    schema: {
      type: 'object',
      properties: {
        purchaseTransaction: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            buyerUserId: { type: 'number', example: 1 },
            totalAmount: { type: 'number', example: 75.00 },
            taxAmount: { type: 'number', example: 11.25 },
            discountAmount: { type: 'number', example: 0.00 },
            finalAmount: { type: 'number', example: 86.25 },
            status: { type: 'string', example: 'pending' },
            purchaseDate: { type: 'string', example: '2025-06-29T02:30:00.000Z' }
          }
        },
        ticket: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            qrCode: { type: 'string', example: 'TKT_1_1719368400000_abc12345' },
            status: { type: 'string', example: 'PENDING' },
            passengerCount: { type: 'number', example: 3 },
            routeInfo: {
              type: 'object',
              properties: {
                routeSheetDetailId: { type: 'number', example: 1 },
                date: { type: 'string', example: '2025-06-29' },
                originCity: { type: 'string', example: 'Quito' },
                destinationCity: { type: 'string', example: 'Guayaquil' },
                departureTime: { type: 'string', example: '08:30:00' }
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
              seatNumber: { type: 'string', example: '1A' },
              seatType: { type: 'string', example: 'NORMAL' },
              passengerType: { type: 'string', example: 'NORMAL' },
              finalPrice: { type: 'number', example: 28.75 }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos o asientos no disponibles' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 409, description: 'Asientos ya ocupados' })
  initiatePurchase(@Req() req: any, @Body() initiatePurchaseDto: InitiatePurchaseDto) {
    // El JWT guard debería agregar el usuario al request
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      throw new BadRequestException('Usuario no identificado');
    }
    return this.ticketsService.initiatePurchase(userId, initiatePurchaseDto);
  }

  @Post('stripe-webhook')
  @ApiOperation({
    summary: '🔗 Webhook de Stripe para confirmación automática de pagos',
    description: 'Endpoint que recibe notificaciones de Stripe cuando un pago es exitoso o falla. Confirma o cancela tickets automáticamente.'
  })
  @ApiResponse({ status: 200, description: 'Webhook procesado exitosamente' })
  @ApiResponse({ status: 400, description: 'Webhook inválido' })
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @RawBody() payload: Buffer
  ) {
    try {

      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      const event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);

      return await this.ticketsService.handleStripeWebhook(event);
    } catch (error) {
      console.error('❌ Error processing Stripe webhook:', error);
      throw new BadRequestException('Invalid webhook');
    }
  }

  @Post('confirm-cash-payment')
  @ApiOperation({
    summary: '💰 Confirmar pago en efectivo',
    description: 'Confirma un pago realizado en efectivo en oficina. Solo para staff autorizado.'
  })
  @ApiBody({ type: ConfirmCashPaymentDto })
  @ApiResponse({
    status: 200,
    description: 'Pago en efectivo confirmado exitosamente',
    schema: {
      type: 'object',
      properties: {
        purchaseTransaction: { type: 'object' },
        ticket: { type: 'object' },
        passengers: { type: 'array' },
        payment: {
          type: 'object',
          properties: {
            method: { type: 'string', example: 'cash' },
            status: { type: 'string', example: 'completed' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Monto incorrecto o transacción ya procesada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada' })
  confirmCashPayment(@Req() req: any, @Body() confirmCashDto: ConfirmCashPaymentDto) {
    // TODO: Validar que el usuario tenga permisos de staff (ADMIN/WORKER)
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      throw new BadRequestException('Usuario no identificado');
    }
    return this.ticketsService.confirmPurchaseCash(confirmCashDto, userId);
  }

  @Get('purchase-status/:purchaseTransactionId')
  @ApiOperation({
    summary: '📊 Consultar estado de compra',
    description: 'Obtiene el estado actual de una transacción de compra. Útil para polling después de iniciar una compra con Stripe.'
  })
  @ApiParam({ name: 'purchaseTransactionId', description: 'ID de la transacción de compra', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Estado de compra obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        status: { type: 'string', example: 'completed' },
        totalAmount: { type: 'number', example: 86.25 },
        ticketStatus: { type: 'string', example: 'CONFIRMED' },
        qrCode: { type: 'string', example: 'TKT_1_1719368400000_abc12345' },
        paymentMethod: { type: 'string', example: 'Stripe' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada' })
  getPurchaseStatus(@Param('purchaseTransactionId', ParseIntPipe) purchaseTransactionId: number) {
    return this.ticketsService.getPurchaseStatus(purchaseTransactionId);
  }

  @Post('cancel-purchase/:purchaseTransactionId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '❌ Cancelar compra',
    description: 'Cancela una transacción de compra y libera los asientos reservados.'
  })
  @ApiParam({ name: 'purchaseTransactionId', description: 'ID de la transacción de compra', type: 'number' })
  @ApiResponse({ status: 200, description: 'Compra cancelada exitosamente' })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada' })
  cancelPurchase(
    @Param('purchaseTransactionId', ParseIntPipe) purchaseTransactionId: number,
    @Body() body: { reason?: string }
  ) {
    return this.ticketsService.cancelPurchase(purchaseTransactionId, body.reason || 'Cancelado por usuario');
  }

  // 📋 Métodos CRUD básicos (mantener compatibilidad)
  @Get()
  @ApiOperation({ summary: '📋 Listar todos los tickets' })
  findAll() {
    return this.ticketsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '🔍 Obtener ticket por ID' })
  @ApiParam({ name: 'id', description: 'ID del ticket', type: 'number' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '🗑️ Eliminar ticket' })
  @ApiParam({ name: 'id', description: 'ID del ticket', type: 'number' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.remove(id);
  }
}