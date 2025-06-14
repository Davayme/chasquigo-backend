import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@ApiTags('payments')
@Controller('payments')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  /* @UseGuards(JwtAuthGuard) */
  @Post('create-payment-intent')
  @ApiOperation({ summary: 'Crear un PaymentIntent de Stripe para procesar pagos' })
  @ApiBody({ type: CreatePaymentIntentDto })
  @ApiResponse({ 
    status: 201, 
    description: 'PaymentIntent creado exitosamente con las credenciales necesarias para el cliente' 
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async createPaymentIntent(@Body() data: CreatePaymentIntentDto) {
    return this.stripeService.createPaymentIntent(
      data.amount,
      data.userEmail,
      data.userId
    );
  }

/*   @UseGuards(JwtAuthGuard) */
  @Get('payment-intent/:id')
  @ApiOperation({ summary: 'Obtener información de un PaymentIntent por su ID' })
  @ApiParam({ name: 'id', description: 'ID del PaymentIntent de Stripe' })
  @ApiResponse({ status: 200, description: 'Información del PaymentIntent' })
  @ApiResponse({ status: 404, description: 'PaymentIntent no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getPaymentIntent(@Param('id') id: string) {
    return this.stripeService.retrievePaymentIntent(id);
  }
}
