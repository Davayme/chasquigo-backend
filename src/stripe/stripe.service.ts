import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    // Usar directamente la clave secreta para pruebas
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-05-28.basil',
    });
  }

  async createPaymentIntent(amount: number, userEmail?: string, userId?: number, metadata?: Record<string, string>) {
    try {
      // Crear un cliente
      const customerData: Stripe.CustomerCreateParams = {
        name: userEmail ? userEmail.split('@')[0] : 'Cliente Chasquigo',
      };
      
      if (userEmail) {
        customerData.email = userEmail;
      }
      
      if (userId) {
        customerData.metadata = {
          userId: userId.toString(),
        };
      }

      const customer = await this.stripe.customers.create(customerData);

      // Crear PaymentIntent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe usa centavos, multiplicamos por 100
        currency: 'usd',
        customer: customer.id,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId: userId?.toString(),
          applicationFee: 'Chasquigo',
          ...metadata, // ✅ Metadata adicional del servicio
        },
      });

      // Crear EphemeralKey para el cliente
      const ephemeralKey = await this.stripe.ephemeralKeys.create(
        { customer: customer.id },
        { apiVersion: '2025-05-28.basil' } 
      );

      // Devolver los datos necesarios para inicializar PaymentSheet en el cliente móvil
      return {
        paymentIntent: paymentIntent.id,
        paymentIntentClientSecret: paymentIntent.client_secret,
        customerEphemeralKeySecret: ephemeralKey.secret,
        customerId: customer.id,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      };
    } catch (error) {
      this.logger.error(`Error al crear PaymentIntent: ${error.message}`, error.stack);
      throw error;
    }
  }

  async retrievePaymentIntent(paymentIntentId: string) {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      this.logger.error(`Error al recuperar PaymentIntent: ${error.message}`, error.stack);
      throw error;
    }
  }
}
