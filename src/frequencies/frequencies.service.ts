import { Injectable } from '@nestjs/common';
import { CreateFrequencyDto } from './dto/req/create-frequency.dto';
import { UpdateFrequencyDto } from './dto/req/update-frequency.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaErrorHandler } from 'src/common/filters/prisma-errors';

@Injectable()
export class FrequenciesService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createFrequencyDto: CreateFrequencyDto) {
    const { departureTime, ...rest } = createFrequencyDto;
    const departureTimeDate = this.timeStringToDate(departureTime);
    return this.prisma.frequency.create({ data: { ...rest, departureTime: departureTimeDate } }).catch((error) => {
      PrismaErrorHandler.handleError(error, 'Crear Frecuencia');
    });
  }

  async findAllByCooperative(cooperativeId: number) {
    return this.prisma.frequency.findMany({
      where: { cooperativeId, isDeleted: false },
      include: {
        originCity: true,
        destinationCity: true,
      },
    }).catch((error) => {
      PrismaErrorHandler.handleError(error, 'Buscar Frecuencias por Cooperativa');
    });
  }


  async findOne(id: number) {
    return this.prisma.frequency.findUnique({ where: { id, isDeleted: false } }).catch((error) => {
      PrismaErrorHandler.handleError(error, 'Buscar Frecuencia por ID');
    });
  }

  async update(id: number, updateFrequencyDto: UpdateFrequencyDto) {
    const { departureTime, ...rest } = updateFrequencyDto;
    const departureTimeDate = this.timeStringToDate(departureTime);
    return this.prisma.frequency.update({ where: { id }, data: { ...rest, departureTime: departureTimeDate } }).catch((error) => {
      PrismaErrorHandler.handleError(error, 'Actualizar Frecuencia');
    });
  }

  async remove(id: number) {
    return this.prisma.frequency.update({ where: { id }, data: { isDeleted: true } }).catch((error) => {
      PrismaErrorHandler.handleError(error, 'Eliminar Frecuencia');
    });
  }

  private timeStringToDate(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
}
