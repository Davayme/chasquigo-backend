import { Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/req/create-payment.dto';
import { UpdatePaymentDto } from './dto/req/update-payment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaErrorHandler } from 'src/common/filters/prisma-errors';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createPaymentDto: CreatePaymentDto) {
    try {
      const {
        tickets,
        userId,
        routeSheetId,
        originStop,
        destinationStop,
        ...paymentData
      } = createPaymentDto;

      return await this.prisma.$transaction(async (prisma) => {
        const payment = await prisma.payment.create({
          data: {
            date: new Date(),
            ...paymentData,
            status: 'Pagado',
          },
        });

        const routeDetail = await prisma.routeSheetDetail.findUnique({
          where: { id: routeSheetId },
        });

        if (!routeDetail) {
          PrismaErrorHandler.handleError('Hoja de ruta no encontrada');
        }

        const frequency = await prisma.frequency.findUnique({
          where: { id: routeDetail.frequencyId },
        });

        if (!frequency) {
          PrismaErrorHandler.handleError('Frecuencia no encontrada');
        }

        const stops = await prisma.intermediateStop.findMany({
          where: { frequencyId: frequency.id },
        });

        const originStopData = await prisma.city.findUnique({
          where: { name: originStop },
        });

        if (!originStopData) {
          PrismaErrorHandler.handleError('Ciudad de origen no encontrada');
        }

        if (originStopData.id !== frequency.originCityId) {
          //ver si no hay el origen en las paradas
          const stop = stops.find((stop) => stop.cityId === originStopData.id);
          if (!stop) {
            PrismaErrorHandler.handleError('Ciudad de origen no encontrada');
          }
        }

        const destinationStopData = await prisma.city.findUnique({
          where: { name: destinationStop },
        });

        if (!destinationStopData) {
          PrismaErrorHandler.handleError('Ciudad de destino no encontrada');
        }

        if (destinationStopData.id !== frequency.destinationCityId) {
          PrismaErrorHandler.handleError('Ciudad de destino no encontrada');
        }

        const ticketData = tickets.map((ticket) => ({
          userId,
          routeSheetId,
          originStopId: originStopData.id,
          destinationStopId: destinationStopData.id,
          purchaseDate: new Date(),
          status: 'Pagado',
          paymentId: payment.id,
          ...ticket,
        }));

        await prisma.ticket.createMany({
          data: ticketData,
        });

        //actualizar el pago con el monto total de sus tikets
        const total = await prisma.ticket.aggregate({
          where: { paymentId: payment.id },
          _sum: { price: true },
        });

        const discount = await prisma.ticket.aggregate({
          where: { paymentId: payment.id },
          _sum: { discount: true },
        });

        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            amount: (total._sum.price as unknown as number) - (discount._sum.discount as unknown as number),
          },
        });

        return payment;
      });
    } catch (error) {
      PrismaErrorHandler.handleError(error, 'Crear Pago');
    }
  }

  findAll(userId: number) {
    return this.prisma.payment.findMany({
      where: { isDeleted: false, tickets: { some: { userId } } },
    });
  }

  findOne(id: number) {
    return this.prisma.payment.findUnique({
      where: { id },
    });
  }

  remove(id: number) {
    return this.prisma.payment.delete({
      where: { id },
    });
  }
}
