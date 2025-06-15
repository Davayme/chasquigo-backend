import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { PrismaErrorHandler } from 'src/common/filters/prisma-errors';
import { Prisma } from '@prisma/client';

@Injectable()
export class BusesService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createBusDto: CreateBusDto) {
    try {
      const {...busData } = createBusDto;

      return await this.prisma.$transaction(async (prisma) => {
        const bus = await prisma.bus.create({
          data: {
            cooperativeId: busData.cooperativeId,
            licensePlate: busData.licensePlate,
            chassisBrand: busData.chassisBrand,
            bodyworkBrand: busData.bodyworkBrand,
            photo: busData.photo,
            stoppageDays: busData.stoppageDays ?? 0,
            busTypeId: busData.busTypeId,
          },
        });

        // Crear asientos asociados
        const seatsData = busData.seats.map(seat => ({
          ...seat,
          busId: bus.id,
        }));

        await prisma.busSeat.createMany({
          data: seatsData,
        });

        return {
          ...bus,
          seats: await prisma.busSeat.findMany({ where: { busId: bus.id } }),
        };
      });
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      PrismaErrorHandler.handleError(error, 'Crear Bus');
    }
  }

  async findAll() {
    try {
      return await this.prisma.bus.findMany({
        where: { isDeleted: false },
        include: { seats: { where: { isDeleted: false } } }
      });
    } catch (error) {
      PrismaErrorHandler.handleError(error, 'Buscar Buses');
    }
  }

  async findOne(id: number) {
    try {
      const bus = await this.prisma.bus.findFirst({
        where: { id, isDeleted: false },
        include: { seats: { where: { isDeleted: false } } }
      });

      if (!bus) {
        throw new NotFoundException(`Bus con ID ${id} no encontrado`);
      }

      return bus;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      PrismaErrorHandler.handleError(error, 'Buscar Bus por ID');
    }
  }

  async update(id: number, updateBusDto: UpdateBusDto) {
    try {
      // Verificar si el bus existe
      const existingBus = await this.prisma.bus.findFirst({
        where: { id, isDeleted: false }
      });

      if (!existingBus) {
        throw new NotFoundException(`Bus con ID ${id} no encontrado`);
      }

      // Actualizar bus
      return await this.prisma.$transaction(async (prisma) => {
        const { seats, ...busData } = updateBusDto;
        
        // Actualizar datos del bus
        const updatedBus = await prisma.bus.update({
          where: { id },
          data: {
            ...(busData.cooperativeId && { cooperativeId: busData.cooperativeId }),
            ...(busData.licensePlate && { licensePlate: busData.licensePlate }),
            ...(busData.chassisBrand && { chassisBrand: busData.chassisBrand }),
            ...(busData.bodyworkBrand && { bodyworkBrand: busData.bodyworkBrand }),
            ...(busData.photo && { photo: busData.photo }),
            ...(busData.stoppageDays !== undefined && { stoppageDays: busData.stoppageDays }),
            ...(busData.busTypeId && { busTypeId: busData.busTypeId }),
          }
        });

        // Si se proporcionan asientos para actualizar
        if (seats && seats.length > 0) {
          // Obtener los asientos actuales
          const currentSeats = await prisma.busSeat.findMany({
            where: { busId: id, isDeleted: false }
          });

          // Mapeo de asientos actuales por número para facilitar búsqueda
          const currentSeatsMap = new Map(
            currentSeats.map(seat => [seat.number, seat])
          );

          // Actualizar o crear asientos
          for (const seat of seats) {
            if (currentSeatsMap.has(seat.number)) {
              // Actualizar asiento existente
              await prisma.busSeat.update({
                where: { id: currentSeatsMap.get(seat.number).id },
                data: {
                  type: seat.type,
                  location: seat.location
                }
              });
            } else {
              // Crear nuevo asiento
              await prisma.busSeat.create({
                data: {
                  busId: id,
                  number: seat.number,
                  type: seat.type,
                  location: seat.location
                }
              });
            }
          }
        }

        // Retornar bus actualizado con sus asientos
        return {
          ...updatedBus,
          seats: await prisma.busSeat.findMany({ 
            where: { busId: id, isDeleted: false } 
          })
        };
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      PrismaErrorHandler.handleError(error, 'Actualizar Bus');
    }
  }

  async remove(id: number) {
    try {
      // Verificar si el bus existe
      const existingBus = await this.prisma.bus.findFirst({
        where: { id, isDeleted: false }
      });

      if (!existingBus) {
        throw new NotFoundException(`Bus con ID ${id} no encontrado`);
      }

      // Eliminado lógico del bus y sus asientos
      return await this.prisma.$transaction(async (prisma) => {
        // Marcar asientos como eliminados
        await prisma.busSeat.updateMany({
          where: { busId: id, isDeleted: false },
          data: { isDeleted: true }
        });

        // Marcar bus como eliminado
        const deletedBus = await prisma.bus.update({
          where: { id },
          data: { isDeleted: true }
        });

        return { message: `Bus con ID ${id} eliminado exitosamente` };
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      PrismaErrorHandler.handleError(error, 'Eliminar Bus');
    }
  }
}