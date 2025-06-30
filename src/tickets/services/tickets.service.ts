import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StripeService } from '../../stripe/stripe.service';
import { InitiatePurchaseDto, PassengerDataDto } from '../dto/req/passenger-data.dto';
import { ConfirmCashPaymentDto } from '../dto/req/confirm-cash.dto';
import { PurchaseResponse, PricingCalculation } from '../dto/res/purcharse-response';
import { TicketStatus, PassengerType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

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
   * 🎫 NUEVO: CREAR COMPRA CON STRIPE
   * Crea la transacción, valida asientos y devuelve keys de Stripe
   */
  async createPurchaseWithStripe(initiatePurchaseDto: InitiatePurchaseDto): Promise<any> {
    const { buyerUserId, routeSheetDetailId, passengers, paymentMethod } = initiatePurchaseDto;

    try {
      console.log(`🚀 Creando compra Stripe para usuario ${buyerUserId} con ${passengers.length} pasajeros`);

      // 1. Validar disponibilidad de asientos
      const seatIds = passengers.map(p => p.seatId);
      const availabilityCheck = await this.validateSeatsAvailability(routeSheetDetailId, seatIds);

      // 2. Calcular precios
      const pricing = await this.calculateTicketPricing(routeSheetDetailId, passengers);

      // 3. Verificar que el usuario comprador existe
      const buyerUser = await this.prisma.user.findUnique({
        where: { id: buyerUserId, isDeleted: false },
      });

      if (!buyerUser) {
        throw new BadRequestException(`Usuario comprador con ID ${buyerUserId} no encontrado`);
      }
      console.log(`✅ Usuario comprador encontrado: ${buyerUser.firstName} ${buyerUser.lastName}`);

      // 4. Crear/encontrar usuarios para cada pasajero
      const passengerUsers = await Promise.all(
        passengers.map(passenger => this.createOrFindUser(passenger))
      );

      // 5. Crear transacción en base de datos (SIN QR codes aún)
      const result = await this.prisma.$transaction(async (tx) => {
        // Crear transacción de compra
        const purchaseTransaction = await tx.purchaseTransaction.create({
          data: {
            buyerUserId,
            totalAmount: pricing.totals.totalBasePrice,
            taxAmount: pricing.totals.totalTaxAmount,
            discountAmount: pricing.totals.totalDiscountAmount,
            finalAmount: pricing.totals.finalTotalPrice,
            status: 'pending', // ✅ PENDING hasta que Stripe confirme
          },
        });

        // Crear ticket principal (SIN QR code aún)
        const ticket = await tx.ticket.create({
          data: {
            buyerUserId,
            frequencyId: availabilityCheck.routeSheet.frequencyId,
            busId: availabilityCheck.routeSheet.busId,
            totalBasePrice: pricing.totals.totalBasePrice,
            totalDiscountAmount: pricing.totals.totalDiscountAmount,
            totalTaxAmount: pricing.totals.totalTaxAmount,
            finalTotalPrice: pricing.totals.finalTotalPrice,
            status: TicketStatus.PENDING, // ✅ PENDING hasta confirmación
            passengerCount: passengers.length,
            originStopId: availabilityCheck.routeSheet.frequency.originCityId,
            destinationStopId: availabilityCheck.routeSheet.frequency.destinationCityId,
            purchaseTransactionId: purchaseTransaction.id,
            qrCode: null, // ✅ Se generará después del pago
          },
        });

        // Crear registros de pasajeros
        const ticketPassengers = await Promise.all(
          passengers.map(async (passenger, index) => {
            const passengerUser = passengerUsers[index];
            const passengerPricing = pricing.passengers[index];
            
            // Obtener el tipo de asiento de la base de datos
            const seat = availabilityCheck.seats.find(s => s.id === passenger.seatId);
            if (!seat) {
              throw new Error(`Asiento ${passenger.seatId} no encontrado`);
            }

            return await tx.ticketPassenger.create({
              data: {
                ticketId: ticket.id,
                passengerUserId: passengerUser.id,
                seatId: passenger.seatId,
                seatType: seat.type, // ✅ Usar el tipo del asiento desde la BD
                passengerType: passenger.passengerType,
                basePrice: passengerPricing.basePrice,
                discountAmount: passengerPricing.discountAmount,
                taxAmount: passengerPricing.taxAmount,
                finalPrice: passengerPricing.finalPrice,
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
          ticket,
          ticketPassengers,
          routeInfo: availabilityCheck.routeSheet,
        };
      });

      // 6. ✅ NUEVO: Crear PaymentIntent en Stripe
      const stripeKeys = await this.stripeService.createPaymentIntent(
        pricing.totals.finalTotalPrice,
        buyerUser?.email,
        buyerUserId,
        { purchaseTransactionId: result.purchaseTransaction.id.toString() } // ✅ Metadata para webhook
      );

      // 7. Preparar respuesta
      const response = {
        transaction: {
          id: result.purchaseTransaction.id,
          finalAmount: parseFloat(result.purchaseTransaction.finalAmount.toString()),
          status: 'pending',
        },
        stripeKeys, // ✅ Keys para el cliente móvil
        ticket: {
          id: result.ticket.id,
          passengerCount: result.ticket.passengerCount,
          routeInfo: {
            routeSheetDetailId: result.routeInfo.id,
            date: result.routeInfo.routeSheetHeader?.startDate 
              ? result.routeInfo.routeSheetHeader.startDate.toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            originCity: result.routeInfo.frequency.originCity.name,
            destinationCity: result.routeInfo.frequency.destinationCity.name,
          },
        },
        passengers: result.ticketPassengers.map(tp => ({
          id: tp.id,
          passengerName: `${tp.passenger.firstName} ${tp.passenger.lastName}`,
          seatNumber: tp.seat.number.toString(),
          seatType: tp.seatType.toString(),
          passengerType: tp.passengerType.toString(),
          finalPrice: parseFloat(tp.finalPrice.toString()),
        })),
      };

      console.log(`✅ Compra creada exitosamente: Transaction ${result.purchaseTransaction.id}, PaymentIntent: ${stripeKeys.paymentIntent}`);
      return response;

    } catch (error) {
      console.error('❌ Error creating purchase with Stripe:', error);
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

        // ✅ MEJORADO: Aceptar 'pending' o cualquier estado que comience con 'pending_'
        const isPending = purchaseTransaction.status === 'pending' || purchaseTransaction.status.startsWith('pending_');
        
        if (!isPending) {
          // ✅ IDEMPOTENCIA: Si ya está completada, devolver información existente sin error
          if (purchaseTransaction.status === 'completed') {
            console.log(`⚠️ Transacción ya completada, devolviendo información existente: ${purchaseTransactionId}`);
            
            // Obtener información del pago existente
            const existingPayment = await tx.payment.findFirst({
              where: { 
                OR: [
                  { stripePaymentId: stripePaymentIntentId },
                  { 
                    AND: [
                      { method: 'Stripe' },
                      { amount: purchaseTransaction.finalAmount }
                    ]
                  }
                ]
              }
            });

            return {
              purchaseTransaction,
              ticket: purchaseTransaction.tickets[0],
              payment: existingPayment,
              wasAlreadyProcessed: true
            };
          }
          
          throw new BadRequestException(`La transacción está en estado: ${purchaseTransaction.status}`);
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

        // Actualizar estado del ticket y generar QR code
        const ticket = purchaseTransaction.tickets[0];
        
        // ✅ AGREGAR: Generar QR code si no existe
        let qrCode = ticket.qrCode;
        if (!qrCode) {
          qrCode = this.generateUniqueQR(ticket.id);
        }

        const updatedTicket = await tx.ticket.update({
          where: { id: ticket.id },
          data: { 
            status: TicketStatus.CONFIRMED,
            qrCode: qrCode
          },
        });

        console.log(`✅ Ticket confirmado: ${ticket.id}, QR: ${qrCode}, Estado: ${TicketStatus.CONFIRMED}`);

        // ✅ ELIMINAR: updateSeatAvailability ya que no existe availableNormalSeats/availableVIPSeats en el nuevo esquema

        return {
          purchaseTransaction: { ...purchaseTransaction, status: 'completed' },
          ticket: { ...updatedTicket, qrCode },
          payment,
        };
      });

      // ✅ CORREGIDO: Obtener información de la ruta desde la frecuencia directamente
      const ticket = result.purchaseTransaction.tickets[0];
      
      // Si ya fue procesada, usar el PaymentIntent del pago existente
      const effectivePaymentIntentId = result.wasAlreadyProcessed && result.payment?.stripePaymentId 
        ? result.payment.stripePaymentId 
        : stripePaymentIntentId;

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
          stripePaymentIntentId: effectivePaymentIntentId,
        },
      };

      // Mensaje diferente si ya fue procesada
      if (result.wasAlreadyProcessed) {
        console.log(`✅ Compra ya confirmada anteriormente con Stripe: ${ticket.id} (idempotencia)`);
      } else {
        console.log(`✅ Compra confirmada exitosamente con Stripe: ${ticket.id}`);
      }
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
   * 💰 NUEVO: CREAR COMPRA DIRECTA EN EFECTIVO
   * Crea la transacción, valida asientos y confirma inmediatamente
   */
  async createPurchaseWithCash(initiatePurchaseDto: InitiatePurchaseDto): Promise<any> {
    const { buyerUserId, routeSheetDetailId, passengers } = initiatePurchaseDto;

    try {
      console.log(`💰 Creando compra en efectivo para usuario ${buyerUserId} con ${passengers.length} pasajeros`);

      // 1. Validar disponibilidad de asientos
      const seatIds = passengers.map(p => p.seatId);
      const availabilityCheck = await this.validateSeatsAvailability(routeSheetDetailId, seatIds);

      // 2. Calcular precios
      const pricing = await this.calculateTicketPricing(routeSheetDetailId, passengers);

      // 3. Verificar que el usuario comprador existe
      const buyerUser = await this.prisma.user.findUnique({
        where: { id: buyerUserId, isDeleted: false },
      });

      if (!buyerUser) {
        throw new BadRequestException(`Usuario comprador con ID ${buyerUserId} no encontrado`);
      }
      console.log(`✅ Usuario comprador encontrado: ${buyerUser.firstName} ${buyerUser.lastName}`);

      // 4. Crear/encontrar usuarios para cada pasajero
      const passengerUsers = await Promise.all(
        passengers.map(passenger => this.createOrFindUser(passenger))
      );

      // 5. Crear transacción y confirmar inmediatamente
      const result = await this.prisma.$transaction(async (tx) => {
        // Crear transacción de compra
        const purchaseTransaction = await tx.purchaseTransaction.create({
          data: {
            buyerUserId,
            totalAmount: pricing.totals.totalBasePrice,
            taxAmount: pricing.totals.totalTaxAmount,
            discountAmount: pricing.totals.totalDiscountAmount,
            finalAmount: pricing.totals.finalTotalPrice,
            status: 'completed', // ✅ Completado inmediatamente para efectivo
          },
        });

        // Crear ticket principal con QR inmediatamente
        const qrCode = this.generateUniqueQR(purchaseTransaction.id); // Usar transaction ID temporalmente
        const ticket = await tx.ticket.create({
          data: {
            buyerUserId,
            frequencyId: availabilityCheck.routeSheet.frequencyId,
            busId: availabilityCheck.routeSheet.busId,
            totalBasePrice: pricing.totals.totalBasePrice,
            totalDiscountAmount: pricing.totals.totalDiscountAmount,
            totalTaxAmount: pricing.totals.totalTaxAmount,
            finalTotalPrice: pricing.totals.finalTotalPrice,
            status: TicketStatus.CONFIRMED, // ✅ Confirmado inmediatamente
            passengerCount: passengers.length,
            originStopId: availabilityCheck.routeSheet.frequency.originCityId,
            destinationStopId: availabilityCheck.routeSheet.frequency.destinationCityId,
            purchaseTransactionId: purchaseTransaction.id,
            qrCode: qrCode,
          },
        });

        // Actualizar QR con el ID real del ticket
        const finalQrCode = this.generateUniqueQR(ticket.id);
        await tx.ticket.update({
          where: { id: ticket.id },
          data: { qrCode: finalQrCode },
        });

        // Crear registros de pasajeros
        const ticketPassengers = await Promise.all(
          passengers.map(async (passenger, index) => {
            const passengerUser = passengerUsers[index];
            const passengerPricing = pricing.passengers[index];
            
            // Obtener el tipo de asiento de la base de datos
            const seat = availabilityCheck.seats.find(s => s.id === passenger.seatId);
            if (!seat) {
              throw new Error(`Asiento ${passenger.seatId} no encontrado`);
            }

            return await tx.ticketPassenger.create({
              data: {
                ticketId: ticket.id,
                passengerUserId: passengerUser.id,
                seatId: passenger.seatId,
                seatType: seat.type,
                passengerType: passenger.passengerType,
                basePrice: passengerPricing.basePrice,
                discountAmount: passengerPricing.discountAmount,
                taxAmount: passengerPricing.taxAmount,
                finalPrice: passengerPricing.finalPrice,
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
          ticket: { ...ticket, qrCode: finalQrCode },
          ticketPassengers,
          routeInfo: availabilityCheck.routeSheet,
        };
      });

      // 5. Preparar respuesta
      const response = {
        transaction: {
          id: result.purchaseTransaction.id,
          finalAmount: parseFloat(result.purchaseTransaction.finalAmount.toString()),
          status: 'completed',
        },
        ticket: {
          id: result.ticket.id,
          qrCode: result.ticket.qrCode,
          status: 'CONFIRMED',
          passengerCount: result.ticket.passengerCount,
          routeInfo: {
            routeSheetDetailId: result.routeInfo.id,
            date: result.routeInfo.routeSheetHeader?.startDate 
              ? result.routeInfo.routeSheetHeader.startDate.toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            originCity: result.routeInfo.frequency.originCity.name,
            destinationCity: result.routeInfo.frequency.destinationCity.name,
          },
        },
        passengers: result.ticketPassengers.map(tp => ({
          id: tp.id,
          passengerName: `${tp.passenger.firstName} ${tp.passenger.lastName}`,
          seatNumber: tp.seat.number.toString(),
          seatType: tp.seatType.toString(),
          passengerType: tp.passengerType.toString(),
          finalPrice: parseFloat(tp.finalPrice.toString()),
        })),
        payment: {
          method: 'cash',
          status: 'completed',
        },
      };

      console.log(`✅ Compra en efectivo completada: Ticket ${result.ticket.id}, QR: ${result.ticket.qrCode}`);
      return response;

    } catch (error) {
      console.error('❌ Error creating cash purchase:', error);
      throw error;
    }
  }

  /**
   * 🔗 MANEJAR WEBHOOK DE STRIPE (con idempotencia)
   */
  async handleStripeWebhook(event: any) {
    try {
      console.log(`🔗 Procesando webhook de Stripe: ${event.type}, ID: ${event.id}`);

      // Lista de eventos que debemos procesar
      const relevantEvents = [
        'payment_intent.succeeded',
        'payment_intent.payment_failed',
        'payment_intent.canceled'
      ];

      // Ignorar eventos no relevantes para nuestro flujo
      if (!relevantEvents.includes(event.type)) {
        console.log(`ℹ️ Evento ignorado (no relevante): ${event.type}`);
        return { received: true, processed: false, reason: 'event_not_relevant' };
      }

      switch (event.type) {
        case 'payment_intent.succeeded':
          return await this.handlePaymentSucceeded(event);

        case 'payment_intent.payment_failed':
        case 'payment_intent.canceled':
          return await this.handlePaymentFailed(event);

        default:
          console.log(`⚠️ Evento relevante pero no implementado: ${event.type}`);
          return { received: true, processed: false, reason: 'not_implemented' };
      }

    } catch (error) {
      console.error('❌ Error handling Stripe webhook:', error);
      throw error;
    }
  }

  /**
   * ✅ MANEJAR PAGO EXITOSO (con idempotencia)
   */
  private async handlePaymentSucceeded(event: any) {
    const paymentIntent = event.data.object;
    const purchaseTransactionId = parseInt(paymentIntent.metadata.purchaseTransactionId);
    
    if (!purchaseTransactionId) {
      console.log(`⚠️ PaymentIntent sin purchaseTransactionId en metadata: ${paymentIntent.id}`);
      return { received: true, processed: false, reason: 'no_transaction_id' };
    }

    try {
      // Verificar estado actual de la transacción (idempotencia)
      const existingTransaction = await this.prisma.purchaseTransaction.findUnique({
        where: { id: purchaseTransactionId },
        select: { status: true, id: true }
      });

      if (!existingTransaction) {
        console.log(`❌ Transacción no encontrada: ${purchaseTransactionId}`);
        return { received: true, processed: false, reason: 'transaction_not_found' };
      }

      // ✅ IDEMPOTENCIA: Si ya está procesada, devolver éxito sin procesar de nuevo
      if (existingTransaction.status === 'completed') {
        console.log(`✅ Transacción ya procesada (idempotencia): ${purchaseTransactionId}`);
        return { received: true, processed: false, reason: 'already_processed' };
      }

      if (existingTransaction.status === 'cancelled') {
        console.log(`⚠️ Intento de procesar transacción ya cancelada: ${purchaseTransactionId}`);
        return { received: true, processed: false, reason: 'transaction_cancelled' };
      }

      // Procesar el pago
      await this.confirmPurchaseStripe(purchaseTransactionId, paymentIntent.id);
      console.log(`✅ Pago exitoso procesado para transacción: ${purchaseTransactionId}`);
      
      return { received: true, processed: true, transactionId: purchaseTransactionId };

    } catch (error) {
      console.error(`❌ Error procesando pago exitoso para transacción ${purchaseTransactionId}:`, error);
      
      // Si es un error de "ya procesada", devolver éxito
      if (error.message?.includes('ya fue procesada')) {
        console.log(`✅ Transacción ya procesada (capturada en error): ${purchaseTransactionId}`);
        return { received: true, processed: false, reason: 'already_processed' };
      }
      
      throw error;
    }
  }

  /**
   * ❌ MANEJAR PAGO FALLIDO (con idempotencia)
   */
  private async handlePaymentFailed(event: any) {
    const paymentIntent = event.data.object;
    const purchaseTransactionId = parseInt(paymentIntent.metadata.purchaseTransactionId);
    
    if (!purchaseTransactionId) {
      console.log(`⚠️ PaymentIntent fallido sin purchaseTransactionId en metadata: ${paymentIntent.id}`);
      return { received: true, processed: false, reason: 'no_transaction_id' };
    }

    try {
      // Verificar estado actual de la transacción (idempotencia)
      const existingTransaction = await this.prisma.purchaseTransaction.findUnique({
        where: { id: purchaseTransactionId },
        select: { status: true, id: true }
      });

      if (!existingTransaction) {
        console.log(`❌ Transacción no encontrada para cancelar: ${purchaseTransactionId}`);
        return { received: true, processed: false, reason: 'transaction_not_found' };
      }

      // ✅ IDEMPOTENCIA: Si ya está cancelada o completada, no procesar de nuevo
      if (existingTransaction.status === 'cancelled') {
        console.log(`✅ Transacción ya cancelada (idempotencia): ${purchaseTransactionId}`);
        return { received: true, processed: false, reason: 'already_cancelled' };
      }

      if (existingTransaction.status === 'completed') {
        console.log(`⚠️ Intento de cancelar transacción ya completada: ${purchaseTransactionId}`);
        return { received: true, processed: false, reason: 'transaction_completed' };
      }

      // Cancelar la transacción
      const reason = `Pago fallido/cancelado en Stripe (${event.type})`;
      await this.cancelPurchase(purchaseTransactionId, reason);
      console.log(`❌ Pago fallido procesado para transacción: ${purchaseTransactionId}`);
      
      return { received: true, processed: true, transactionId: purchaseTransactionId };

    } catch (error) {
      console.error(`❌ Error procesando pago fallido para transacción ${purchaseTransactionId}:`, error);
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