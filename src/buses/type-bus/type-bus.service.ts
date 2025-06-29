import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTypeBusDto } from './dto/create-type-bus.dto';
import { UpdateTypeBusDto } from './dto/update-type-bus.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaErrorHandler } from 'src/common/filters/prisma-errors';

@Injectable()
export class TypeBusService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTypeBusDto) {
    try {
      return await this.prisma.busType.create({
        data: dto,
      });
    } catch (error) {
      PrismaErrorHandler.handleError(error, 'Crear Tipo de Bus');
    }
  }

  async findAll() {
    try {
      return await this.prisma.busType.findMany({
        where: { isDeleted: false },
      });
    } catch (error) {
      PrismaErrorHandler.handleError(error, 'Buscar Tipos de Buses');
    }
  }

  async findOne(id: number) {
    try {
      const typeBus = await this.prisma.busType.findFirst({
        where: { id, isDeleted: false },
      });

      if (!typeBus) {
        throw new NotFoundException(`Tipo de Bus con ID ${id} no encontrado`);
      }

      return typeBus;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      PrismaErrorHandler.handleError(error, 'Buscar Tipo de Bus por ID');
    }
  }

  async update(id: number, dto : UpdateTypeBusDto) {
    try {
      const typeBus = await this.prisma.busType.update({
        where: { id, isDeleted: false },
        data: dto,
      });

      if (!typeBus) {
        throw new NotFoundException(`Tipo de Bus con ID ${id} no encontrado`);
      }

      return typeBus;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      PrismaErrorHandler.handleError(error, 'Actualizar Tipo de Bus');
    }
  }

  async remove(id: number) {
    try {
      const typeBus = await this.prisma.busType.update({
        where: { id, isDeleted: false },
        data: { isDeleted: true },
      });

      if (!typeBus) {
        throw new NotFoundException(`Tipo de Bus con ID ${id} no encontrado`);
      }

      return typeBus;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      PrismaErrorHandler.handleError(error, 'Eliminar Tipo de Bus');
    }
  }
}
