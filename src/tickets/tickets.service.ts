import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InitiatePurchaseDto, PassengerDataDto } from '../tickets/dto/req/passenger-data.dto';
import { ConfirmCashPaymentDto } from './dto/req/confirm-cash.dto';
import { PurchaseResponse, PricingCalculation } from '../tickets/dto/res/purcharse-response';
import { TicketStatus, PassengerType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validar que los asientos estén disponibles
   */
  async validateSeatsAvailability(routeSheetDetailId: number, seatIds: number[]) {
    try {
      console.log(`🔍 Validando disponibilidad de asientos: ${seatIds} para ruta: ${routeSheetDetailId}`);

      // Verificar que la ruta existe
      const routeSheet = await this.prisma.routeSheetDetail.findUnique({
        where: { id: routeSheetDetailId, isDeleted: false },
        include: { 
          frequency: {
            include: {
              originCity: true,
              destinationCity: true,
            },
          }, 
          bus: true,
          routeSheetHeader: true, // ✅ Incluir header para obtener fecha
        },
      });

      if (!routeSheet) {
        throw new NotFoundException('Ruta no encontrada');
      }

      // Verificar que todos los asientos existen en el bus
      const seats = await this.prisma.busSeat.findMany({
        where: {
          id: { in: seatIds },
          busId: routeSheet.busId,
          isDeleted: false,
        },
      });

      if (seats.length !== seatIds.length) {
        throw new BadRequestException('Algunos asientos no existen en este bus');
      }

      // ✅ CORREGIDO: Verificar que los asientos no estén ocupados usando busId + frequencyId
      const occupiedSeats = await this.prisma.ticketPassenger.findMany({
        where: {
          seatId: { in: seatIds },
          ticket: {
            busId: routeSheet.busId,
            frequencyId: routeSheet.frequencyId,
            status: { in: [TicketStatus.PENDING, TicketStatus.PAID, TicketStatus.CONFIRMED, TicketStatus.BOARDED] },
            isDeleted: false,
          },
          isDeleted: false,
        },
        include: { seat: true },
      });

      if (occupiedSeats.length > 0) {
        const occupiedSeatNumbers = occupiedSeats.map(tp => tp.seat.number);
        throw new ConflictException(`Los siguientes asientos ya están ocupados: ${occupiedSeatNumbers.join(', ')}`);
      }

      console.log(`✅ Todos los asientos están disponibles`);
      return {
        available: true,
        routeSheet,
        seats,
        message: 'Todos los asientos están disponibles',
      };
    } catch (error) {
      console.error('❌ Error validating seats availability:', error);
      throw error;
    }
  }

  /**
   * Calcular precios de tickets con descuentos e IVA
   */
  async calculateTicketPricing(routeSheetDetailId: number, passengersData: PassengerDataDto[]): Promise<PricingCalculation> {
    try {
      console.log(`💰 Calculando precios para ${passengersData.length} pasajeros`);

      // Obtener información de precios de la ruta
      const routeSheet = await this.prisma.routeSheetDetail.findUnique({
        where: { id: routeSheetDetailId, isDeleted: false },
        include: {
          frequency: {
            include: {
              routePrice: true,
            },
          },
        },
      });

      if (!routeSheet || !routeSheet.frequency.routePrice) {
        throw new NotFoundException('Configuración de precios no encontrada para esta ruta');
      }

      const routePrice = routeSheet.frequency.routePrice;
      const seatIds = passengersData.map(p => p.seatId);

      // Obtener información de asientos
      const seats = await this.prisma.busSeat.findMany({
        where: { id: { in: seatIds } },
      });

      const seatMap = new Map(seats.map(seat => [seat.id, seat]));

      // Calcular precio para cada pasajero
      const passengerPricing = passengersData.map(passenger => {
        const seat = seatMap.get(passenger.seatId);
        if (!seat) {
          throw new BadRequestException(`Asiento ${passenger.seatId} no encontrado`);
        }

        // Precio base según tipo de asiento
        const basePrice = seat.type === 'VIP' 
          ? parseFloat(routePrice.vipPrice.toString())
          : parseFloat(routePrice.normalPrice.toString());

        // Calcular descuento según tipo de pasajero
        let discountPercent = 0;
        switch (passenger.passengerType) {
          case PassengerType.CHILD:
            discountPercent = parseFloat(routePrice.childDiscount.toString());
            break;
          case PassengerType.SENIOR:
            discountPercent = parseFloat(routePrice.seniorDiscount.toString());
            break;
          case PassengerType.HANDICAPPED:
            discountPercent = parseFloat(routePrice.handicappedDiscount.toString());
            break;
          case PassengerType.NORMAL:
          default:
            discountPercent = 0;
            break;
        }

        const discountAmount = (basePrice * discountPercent) / 100;
        const priceAfterDiscount = basePrice - discountAmount;

        // Calcular IVA
        const taxRate = parseFloat(routePrice.taxRate.toString());
        const taxAmount = routePrice.includesTax 
          ? 0 // Si ya incluye IVA, no agregar más
          : (priceAfterDiscount * taxRate) / 100;

        const finalPrice = priceAfterDiscount + taxAmount;

        console.log(`💺 Asiento ${seat.number}: Base $${basePrice}, Descuento $${discountAmount}, IVA $${taxAmount}, Final $${finalPrice}`);

        return {
          seatId: passenger.seatId,
          seatType: seat.type,
          basePrice: parseFloat(basePrice.toFixed(2)),
          discountAmount: parseFloat(discountAmount.toFixed(2)),
          taxAmount: parseFloat(taxAmount.toFixed(2)),
          finalPrice: parseFloat(finalPrice.toFixed(2)),
        };
      });

      // Calcular totales
      const totals = {
        totalBasePrice: parseFloat(passengerPricing.reduce((sum, p) => sum + p.basePrice, 0).toFixed(2)),
        totalDiscountAmount: parseFloat(passengerPricing.reduce((sum, p) => sum + p.discountAmount, 0).toFixed(2)),
        totalTaxAmount: parseFloat(passengerPricing.reduce((sum, p) => sum + p.taxAmount, 0).toFixed(2)),
        finalTotalPrice: parseFloat(passengerPricing.reduce((sum, p) => sum + p.finalPrice, 0).toFixed(2)),
      };

      console.log(`💰 Total calculado: $${totals.finalTotalPrice}`);
      return { passengers: passengerPricing, totals };
    } catch (error) {
      console.error('❌ Error calculating ticket pricing:', error);
      throw error;
    }
  }

  /**
   * Crear o encontrar usuario temporal (SOLO con nombre, apellido y cédula)
   */
  async createOrFindUser(passengerData: PassengerDataDto) {
    try {
      // Buscar usuario existente por cédula
      let user = await this.prisma.user.findFirst({
        where: { 
          idNumber: passengerData.idNumber,
          isDeleted: false,
        },
      });

      if (!user) {
        // Crear usuario temporal con datos mínimos
        user = await this.prisma.user.create({
          data: {
            idNumber: passengerData.idNumber,
            documentType: 'cedula',
            firstName: passengerData.firstName,
            lastName: passengerData.lastName,
            email: `temp_${passengerData.idNumber}@chasquigo.com`,
            phone: '0000000000',
            password: null, // Usuario temporal
          },
        });

        console.log(`👤 Usuario temporal creado: ${user.firstName} ${user.lastName} (Cédula: ${user.idNumber})`);
      } else {
        // Si existe, actualizar nombre y apellido por si cambió
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            firstName: passengerData.firstName,
            lastName: passengerData.lastName,
          },
        });
        console.log(`👤 Usuario existente actualizado: ${user.firstName} ${user.lastName} (ID: ${user.id})`);
      }

      return user;
    } catch (error) {
      console.error('❌ Error creating or finding user:', error);
      throw new BadRequestException('Error al crear o encontrar usuario');
    }
  }

  /**
   * Generar código QR único
   */
  private generateUniqueQR(ticketId: number): string {
    const timestamp = Date.now();
    const random = uuidv4().substring(0, 8);
    return `TKT_${ticketId}_${timestamp}_${random}`;
  }

  /**
   * 🎫 INICIAR PROCESO DE COMPRA
   */
  async initiatePurchase(initiatePurchaseDto: InitiatePurchaseDto): Promise<PurchaseResponse> {
    const { buyerUserId, routeSheetDetailId, passengers, paymentMethod } = initiatePurchaseDto;

    try {
      console.log(`🚀 Iniciando compra para usuario ${buyerUserId} con ${passengers.length} pasajeros`);

      // 1. Validar disponibilidad de asientos
      const seatIds = passengers.map(p => p.seatId);
      const availabilityCheck = await this.validateSeatsAvailability(routeSheetDetailId, seatIds);

      // 2. Calcular precios
      const pricing = await this.calculateTicketPricing(routeSheetDetailId, passengers);

      // 3. Crear/encontrar usuarios para cada pasajero
      const passengerUsers = await Promise.all(
        passengers.map(passenger => this.createOrFindUser(passenger))
      );

      // 4. Crear transacción en base de datos
      const result = await this.prisma.$transaction(async (tx) => {
        // Crear PurchaseTransaction
        const purchaseTransaction = await tx.purchaseTransaction.create({
          data: {
            buyerUserId,
            totalAmount: pricing.totals.totalBasePrice,
            taxAmount: pricing.totals.totalTaxAmount,
            discountAmount: pricing.totals.totalDiscountAmount,
            finalAmount: pricing.totals.finalTotalPrice,
            status: 'pending',
          },
        });

        // ✅ CORREGIDO: Crear Ticket grupal con busId y frequencyId
        const ticket = await tx.ticket.create({
          data: {
            buyerUserId,
            busId: availabilityCheck.routeSheet.busId,
            frequencyId: availabilityCheck.routeSheet.frequencyId,
            totalBasePrice: pricing.totals.totalBasePrice,
            totalDiscountAmount: pricing.totals.totalDiscountAmount,
            totalTaxAmount: pricing.totals.totalTaxAmount,
            finalTotalPrice: pricing.totals.finalTotalPrice,
            status: TicketStatus.PENDING,
            passengerCount: passengers.length,
            originStopId: availabilityCheck.routeSheet.frequency.originCityId,
            destinationStopId: availabilityCheck.routeSheet.frequency.destinationCityId,
            purchaseTransactionId: purchaseTransaction.id,
            qrCode: null, // Se generará después
          },
        });

        // Generar y actualizar QR
        const qrCode = this.generateUniqueQR(ticket.id);
        await tx.ticket.update({
          where: { id: ticket.id },
          data: { qrCode },
        });

        // Crear TicketPassenger para cada pasajero
        const ticketPassengers = await Promise.all(
          passengers.map(async (passenger, index) => {
            const seat = availabilityCheck.seats.find(s => s.id === passenger.seatId);
            const pricing_passenger = pricing.passengers[index];

            return await tx.ticketPassenger.create({
              data: {
                ticketId: ticket.id,
                passengerUserId: passengerUsers[index].id,
                seatId: passenger.seatId,
                seatType: seat.type,
                passengerType: passenger.passengerType,
                basePrice: pricing_passenger.basePrice,
                discountAmount: pricing_passenger.discountAmount,
                taxAmount: pricing_passenger.taxAmount,
                finalPrice: pricing_passenger.finalPrice,
              },
              include: {
                passenger: true,
                seat: true,
              },
            });
          })
        );

        return {
          purchaseTransaction,
          ticket: { ...ticket, qrCode },
          ticketPassengers,
          routeInfo: availabilityCheck.routeSheet,
        };
      });

      // Preparar respuesta
      const response: PurchaseResponse = {
        purchaseTransaction: {
          id: result.purchaseTransaction.id,
          buyerUserId: result.purchaseTransaction.buyerUserId,
          totalAmount: parseFloat(result.purchaseTransaction.totalAmount.toString()),
          taxAmount: parseFloat(result.purchaseTransaction.taxAmount.toString()),
          discountAmount: parseFloat(result.purchaseTransaction.discountAmount.toString()),
          finalAmount: parseFloat(result.purchaseTransaction.finalAmount.toString()),
          status: result.purchaseTransaction.status,
          purchaseDate: result.purchaseTransaction.purchaseDate.toISOString(),
        },
        ticket: {
          id: result.ticket.id,
          qrCode: result.ticket.qrCode,
          status: result.ticket.status,
          passengerCount: result.ticket.passengerCount,
          routeInfo: {
            routeSheetDetailId: result.routeInfo.id,
            date: result.routeInfo.routeSheetHeader?.startDate 
              ? result.routeInfo.routeSheetHeader.startDate.toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            originCity: result.routeInfo.frequency.originCity.name,
            destinationCity: result.routeInfo.frequency.destinationCity.name,
            departureTime: result.routeInfo.frequency.departureTime.toTimeString(),
          },
        },
        passengers: result.ticketPassengers.map(tp => ({
          id: tp.id,
          passengerName: `${tp.passenger.firstName} ${tp.passenger.lastName}`,
          seatNumber: tp.seat.number.toString(), // ✅ Convertir a string
          seatType: tp.seatType.toString(),
          passengerType: tp.passengerType.toString(),
          finalPrice: parseFloat(tp.finalPrice.toString()),
        })),
      };

      console.log(`✅ Compra iniciada exitosamente: Ticket ${result.ticket.id}, QR: ${result.ticket.qrCode}`);
      return response;

    } catch (error) {
      console.error('❌ Error initiating purchase:', error);
      throw error;
    }
  }

  /**
   * 💳 CONFIRMAR COMPRA CON STRIPE (llamado por webhook)
   */
  async confirmPurchaseStripe(purchaseTransactionId: number, stripePaymentIntentId: string): Promise<PurchaseResponse> {
    try {
      console.log(`💳 Confirmando compra Stripe: Transaction ${purchaseTransactionId}, PaymentIntent: ${stripePaymentIntentId}`);

      const result = await this.prisma.$transaction(async (tx) => {
        // ✅ CORREGIDO: Obtener transacción con tickets y datos relacionados
        const purchaseTransaction = await tx.purchaseTransaction.findUnique({
          where: { id: purchaseTransactionId },
          include: {
            tickets: {
              include: {
                ticketPassengers: {
                  include: {
                    passenger: true,
                    seat: true,
                  },
                },
                Bus: true,
                Frequency: {
                  include: {
                    originCity: true,
                    destinationCity: true,
                  },
                },
              },
            },
          },
        });

        if (!purchaseTransaction) {
          throw new NotFoundException('Transacción no encontrada');
        }

        if (purchaseTransaction.status !== 'pending') {
          throw new BadRequestException('La transacción ya fue procesada');
        }

        // Crear registro de pago
        const payment = await tx.payment.create({
          data: {
            method: 'Stripe',
            amount: purchaseTransaction.finalAmount,
            status: 'completed',
            date: new Date(),
            stripePaymentId: stripePaymentIntentId,
          },
        });

        // Actualizar transacción
        await tx.purchaseTransaction.update({
          where: { id: purchaseTransactionId },
          data: {
            status: 'completed',
            paymentId: payment.id,
          },
        });

        // Actualizar estado del ticket
        const ticket = purchaseTransaction.tickets[0];
        await tx.ticket.update({
          where: { id: ticket.id },
          data: { status: TicketStatus.CONFIRMED },
        });

        // ✅ ELIMINAR: updateSeatAvailability ya que no existe availableNormalSeats/availableVIPSeats en el nuevo esquema

        return {
          purchaseTransaction: { ...purchaseTransaction, status: 'completed' },
          ticket: { ...ticket, status: TicketStatus.CONFIRMED },
          payment,
        };
      });

      // ✅ CORREGIDO: Obtener información de la ruta desde la frecuencia directamente
      const ticket = result.purchaseTransaction.tickets[0];
      const frequency = await this.prisma.frequency.findUnique({
        where: { id: ticket.frequencyId },
        include: {
          originCity: true,
          destinationCity: true,
        },
      });

      const response: PurchaseResponse = {
        purchaseTransaction: {
          id: result.purchaseTransaction.id,
          buyerUserId: result.purchaseTransaction.buyerUserId,
          totalAmount: parseFloat(result.purchaseTransaction.totalAmount.toString()),
          taxAmount: parseFloat(result.purchaseTransaction.taxAmount.toString()),
          discountAmount: parseFloat(result.purchaseTransaction.discountAmount.toString()),
          finalAmount: parseFloat(result.purchaseTransaction.finalAmount.toString()),
          status: 'completed',
          purchaseDate: result.purchaseTransaction.purchaseDate.toISOString(),
        },
        ticket: {
          id: ticket.id,
          qrCode: ticket.qrCode,
          status: TicketStatus.CONFIRMED,
          passengerCount: ticket.passengerCount,
          routeInfo: {
            routeSheetDetailId: 0, // No disponible desde ticket
            date: new Date().toISOString().split('T')[0], // Usar fecha actual por ahora
            originCity: frequency?.originCity.name || 'N/A',
            destinationCity: frequency?.destinationCity.name || 'N/A',
            departureTime: frequency?.departureTime.toTimeString() || '00:00:00',
          },
        },
        passengers: ticket.ticketPassengers.map(tp => ({
          id: tp.id,
          passengerName: `${tp.passenger.firstName} ${tp.passenger.lastName}`,
          seatNumber: tp.seat.number.toString(), // ✅ Convertir a string
          seatType: tp.seatType.toString(),
          passengerType: tp.passengerType.toString(),
          finalPrice: parseFloat(tp.finalPrice.toString()),
        })),
        payment: {
          method: 'Stripe',
          status: 'completed',
          stripePaymentIntentId,
        },
      };

      console.log(`✅ Compra confirmada exitosamente con Stripe: ${ticket.id}`);
      return response;

    } catch (error) {
      console.error('❌ Error confirming Stripe purchase:', error);
      throw error;
    }
  }

  /**
   * 💰 CONFIRMAR COMPRA CON EFECTIVO
   */
  async confirmPurchaseCash(confirmCashDto: ConfirmCashPaymentDto): Promise<PurchaseResponse> {
    const { staffUserId, purchaseTransactionId, amount, notes } = confirmCashDto;

    try {
      console.log(`💰 Confirmando compra en efectivo: Transaction ${purchaseTransactionId}, Monto: ${amount}, Staff: ${staffUserId}`);

      const result = await this.prisma.$transaction(async (tx) => {
        // ✅ CORREGIDO: Obtener transacción con tickets
        const purchaseTransaction = await tx.purchaseTransaction.findUnique({
          where: { id: purchaseTransactionId },
          include: {
            tickets: {
              include: {
                ticketPassengers: {
                  include: {
                    passenger: true,
                    seat: true,
                  },
                },
                Bus: true,
                Frequency: {
                  include: {
                    originCity: true,
                    destinationCity: true,
                  },
                },
              },
            },
          },
        });

        if (!purchaseTransaction) {
          throw new NotFoundException('Transacción no encontrada');
        }

        if (purchaseTransaction.status !== 'pending') {
          throw new BadRequestException('La transacción ya fue procesada');
        }

        // Validar monto
        const expectedAmount = parseFloat(purchaseTransaction.finalAmount.toString());
        if (Math.abs(amount - expectedAmount) > 0.01) {
          throw new BadRequestException(`El monto recibido (${amount}) no coincide con el total (${expectedAmount})`);
        }

        // Crear registro de pago
        const payment = await tx.payment.create({
          data: {
            method: 'cash',
            amount: purchaseTransaction.finalAmount,
            status: 'completed',
            date: new Date(),
            stripePaymentId: notes ? `CASH_${Date.now()}_${notes.substring(0, 20)}` : `CASH_${Date.now()}`,
          },
        });

        // Actualizar transacción
        await tx.purchaseTransaction.update({
          where: { id: purchaseTransactionId },
          data: {
            status: 'completed',
            paymentId: payment.id,
          },
        });

        // Actualizar estado del ticket
        const ticket = purchaseTransaction.tickets[0];
        await tx.ticket.update({
          where: { id: ticket.id },
          data: { status: TicketStatus.CONFIRMED },
        });

        return {
          purchaseTransaction: { ...purchaseTransaction, status: 'completed' },
          ticket: { ...ticket, status: TicketStatus.CONFIRMED },
          payment,
        };
      });

      // ✅ CORREGIDO: Preparar respuesta usando Frequency directamente
      const ticket = result.purchaseTransaction.tickets[0];
      const response: PurchaseResponse = {
        purchaseTransaction: {
          id: result.purchaseTransaction.id,
          buyerUserId: result.purchaseTransaction.buyerUserId,
          totalAmount: parseFloat(result.purchaseTransaction.totalAmount.toString()),
          taxAmount: parseFloat(result.purchaseTransaction.taxAmount.toString()),
          discountAmount: parseFloat(result.purchaseTransaction.discountAmount.toString()),
          finalAmount: parseFloat(result.purchaseTransaction.finalAmount.toString()),
          status: 'completed',
          purchaseDate: result.purchaseTransaction.purchaseDate.toISOString(),
        },
        ticket: {
          id: ticket.id,
          qrCode: ticket.qrCode,
          status: TicketStatus.CONFIRMED,
          passengerCount: ticket.passengerCount,
          routeInfo: {
            routeSheetDetailId: 0, // No disponible desde ticket
            date: new Date().toISOString().split('T')[0], // Usar fecha actual por ahora
            originCity: ticket.Frequency.originCity.name,
            destinationCity: ticket.Frequency.destinationCity.name,
            departureTime: ticket.Frequency.departureTime.toTimeString(),
          },
        },
        passengers: ticket.ticketPassengers.map(tp => ({
          id: tp.id,
          passengerName: `${tp.passenger.firstName} ${tp.passenger.lastName}`,
          seatNumber: tp.seat.number.toString(), // ✅ Convertir a string
          seatType: tp.seatType.toString(),
          passengerType: tp.passengerType.toString(),
          finalPrice: parseFloat(tp.finalPrice.toString()),
        })),
        payment: {
          method: 'cash',
          status: 'completed',
        },
      };

      console.log(`✅ Compra en efectivo confirmada por staff ${staffUserId}: ${ticket.id}`);
      return response;

    } catch (error) {
      console.error('❌ Error confirming cash purchase:', error);
      throw error;
    }
  }

  /**
   * 🔗 MANEJAR WEBHOOK DE STRIPE
   */
  async handleStripeWebhook(event: any) {
    try {
      console.log(`🔗 Procesando webhook de Stripe: ${event.type}`);

      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          const purchaseTransactionId = parseInt(paymentIntent.metadata.purchaseTransactionId);
          
          if (purchaseTransactionId) {
            await this.confirmPurchaseStripe(purchaseTransactionId, paymentIntent.id);
            console.log(`✅ Pago exitoso procesado para transacción: ${purchaseTransactionId}`);
          }
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object;
          const failedTransactionId = parseInt(failedPayment.metadata.purchaseTransactionId);
          
          if (failedTransactionId) {
            await this.cancelPurchase(failedTransactionId, 'Pago fallido en Stripe');
            console.log(`❌ Pago fallido procesado para transacción: ${failedTransactionId}`);
          }
          break;

        default:
          console.log(`ℹ️ Evento no manejado: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error('❌ Error handling Stripe webhook:', error);
      throw error;
    }
  }

  /**
   * ❌ CANCELAR COMPRA
   */
  async cancelPurchase(purchaseTransactionId: number, reason: string) {
    try {
      console.log(`❌ Cancelando compra: ${purchaseTransactionId}, Razón: ${reason}`);

      return await this.prisma.$transaction(async (tx) => {
        // Actualizar transacción
        await tx.purchaseTransaction.update({
          where: { id: purchaseTransactionId },
          data: { status: 'cancelled' },
        });

        // Obtener y cancelar tickets
        const tickets = await tx.ticket.findMany({
          where: { purchaseTransactionId },
          include: {
            ticketPassengers: true,
          },
        });

        for (const ticket of tickets) {
          await tx.ticket.update({
            where: { id: ticket.id },
            data: { status: TicketStatus.CANCELLED },
          });

          // ✅ ELIMINAR: Liberar asientos no necesario en el nuevo esquema
          // Los asientos se liberan automáticamente al cancelar el ticket
        }

        console.log(`✅ Compra cancelada exitosamente: ${purchaseTransactionId}`);
        return { cancelled: true, reason };
      });

    } catch (error) {
      console.error('❌ Error cancelling purchase:', error);
      throw new BadRequestException('Error al cancelar la compra');
    }
  }

  /**
   * 📊 OBTENER ESTADO DE COMPRA
   */
  async getPurchaseStatus(purchaseTransactionId: number) {
    try {
      const purchaseTransaction = await this.prisma.purchaseTransaction.findUnique({
        where: { id: purchaseTransactionId },
        include: {
          tickets: {
            include: {
              ticketPassengers: {
                include: {
                  passenger: true,
                  seat: true,
                },
              },
            },
          },
          payment: true,
        },
      });

      if (!purchaseTransaction) {
        throw new NotFoundException('Transacción no encontrada');
      }

      return {
        id: purchaseTransaction.id,
        status: purchaseTransaction.status,
        totalAmount: parseFloat(purchaseTransaction.finalAmount.toString()),
        ticketStatus: purchaseTransaction.tickets[0]?.status || 'unknown',
        qrCode: purchaseTransaction.tickets[0]?.qrCode || null,
        paymentMethod: purchaseTransaction.payment?.method || null,
      };
    } catch (error) {
      console.error('❌ Error getting purchase status:', error);
      throw error;
    }
  }

  // ✅ ELIMINADO: updateSeatAvailability no existe en el nuevo esquema
  // Los asientos ocupados se determinan por la existencia de TicketPassenger records

}