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

  @Post('purchase')
  @ApiOperation({
    summary: '🚀 Iniciar compra de tickets con Stripe',
    description: 'Crea la transacción, valida asientos, calcula precios y devuelve las keys de Stripe para procesar el pago en el cliente.'
  })
  @ApiBody({ type: InitiatePurchaseDto })
  @ApiResponse({
    status: 201,
    description: 'Transacción creada y keys de Stripe generadas',
    schema: {
      type: 'object',
      properties: {
        transaction: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            finalAmount: { type: 'number', example: 86.25 },
            status: { type: 'string', example: 'pending' }
          }
        },
        stripeKeys: {
          type: 'object',
          properties: {
            paymentIntent: { type: 'string', example: 'pi_3MtwBwLkdIwHu7ix28a3tqPa' },
            paymentIntentClientSecret: { type: 'string', example: 'pi_3MtwBwLkdIwHu7ix28a3tqPa_secret_YWNjdA==' },
            customerEphemeralKeySecret: { type: 'string', example: 'ek_test_YWNjdA==' },
            customerId: { type: 'string', example: 'cus_NffrFeUfNV2Hib' },
            publishableKey: { type: 'string', example: 'pk_test_...' }
          }
        },
        ticket: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            passengerCount: { type: 'number', example: 3 },
            routeInfo: {
              type: 'object',
              properties: {
                routeSheetDetailId: { type: 'number', example: 1 },
                date: { type: 'string', example: '2025-06-29' },
                originCity: { type: 'string', example: 'Quito' },
                destinationCity: { type: 'string', example: 'Guayaquil' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos o asientos no disponibles' })
  @ApiResponse({ status: 409, description: 'Asientos ya ocupados' })
  async purchaseWithStripe(@Body() initiatePurchaseDto: InitiatePurchaseDto) {
    return this.ticketsService.createPurchaseWithStripe(initiatePurchaseDto);
  }

  @Post('stripe-webhook')
  @ApiOperation({
    summary: '🔗 Webhook de Stripe - Confirmación automática de pagos',
    description: 'Recibe notificaciones de Stripe cuando un pago es exitoso. Confirma el ticket y genera el QR code automáticamente.'
  })
  @ApiResponse({ status: 200, description: 'Webhook procesado - Pago confirmado y ticket activado' })
  @ApiResponse({ status: 400, description: 'Webhook inválido o pago fallido' })
  async confirmStripePayment(
    @Headers('stripe-signature') signature: string,
    @RawBody() payload: Buffer
  ) {
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      const event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);

      console.log(`🔗 Webhook Stripe recibido: ${event.type}`);
      
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
  confirmCashPayment(@Body() confirmCashDto: ConfirmCashPaymentDto) {
    // ✅ CORREGIDO: Obtener staffUserId del body, no del JWT
    return this.ticketsService.confirmPurchaseCash(confirmCashDto);
  }

  @Get('status/:purchaseTransactionId')
  @ApiOperation({
    summary: '📊 Consultar estado de compra y pago',
    description: 'Obtiene el estado actual de una transacción. Útil para verificar si el pago de Stripe ya fue procesado.'
  })
  @ApiParam({ name: 'purchaseTransactionId', description: 'ID de la transacción de compra', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Estado de compra obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        transaction: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            status: { type: 'string', example: 'completed' },
            finalAmount: { type: 'number', example: 86.25 }
          }
        },
        ticket: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            status: { type: 'string', example: 'CONFIRMED' },
            qrCode: { type: 'string', example: 'TKT_1_1719368400000_abc12345' }
          }
        },
        payment: {
          type: 'object',
          properties: {
            method: { type: 'string', example: 'Stripe' },
            status: { type: 'string', example: 'completed' }
          }
        }
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

  @Post('purchase-cash')
  @ApiOperation({
    summary: '💰 Compra directa en efectivo',
    description: 'Crea y confirma inmediatamente una compra en efectivo. Solo para staff autorizado en oficina.'
  })
  @ApiBody({ type: InitiatePurchaseDto })
  @ApiResponse({
    status: 201,
    description: 'Compra en efectivo completada exitosamente',
    schema: {
      type: 'object',
      properties: {
        transaction: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            finalAmount: { type: 'number', example: 86.25 },
            status: { type: 'string', example: 'completed' }
          }
        },
        ticket: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            qrCode: { type: 'string', example: 'TKT_1_1719368400000_abc12345' },
            status: { type: 'string', example: 'CONFIRMED' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos o asientos no disponibles' })
  @ApiResponse({ status: 401, description: 'No autorizado - Solo para staff' })
  async purchaseWithCash(@Body() initiatePurchaseDto: InitiatePurchaseDto) {
    return this.ticketsService.createPurchaseWithCash(initiatePurchaseDto);
  }

}