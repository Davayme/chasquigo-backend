import { Injectable } from '@nestjs/common';
import { CreateCityDto } from './dto/req/create-city.dto';
import { UpdateCityDto } from './dto/req/update-city.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaErrorHandler } from 'src/common/filters/prisma-errors';

@Injectable()
export class CitiesService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createCityDto: CreateCityDto) {
    return this.prisma.city.create({ data: createCityDto }).catch((error) => {
      PrismaErrorHandler.handleError(error, 'Crear Ciudad');
    });
  }

  async findAll() {
    return this.prisma.city.findMany({ where: { isDeleted: false } }).catch((error) => {
      PrismaErrorHandler.handleError(error, 'Buscar Ciudades');
    });
  }

  async findOne(id: number) {
    return this.prisma.city.findUnique({ where: { id, isDeleted: false } }).catch((error) => {
      PrismaErrorHandler.handleError(error, 'Buscar Ciudad por ID');
    });
  }

  async update(id: number, updateCityDto: UpdateCityDto) {
    return this.prisma.city.update({ where: { id }, data: updateCityDto }).catch((error) => {
      PrismaErrorHandler.handleError(error, 'Actualizar Ciudad');
    });
  }

  async remove(id: number) {
    return this.prisma.city.update({ where: { id }, data: { isDeleted: true } }).catch((error) => {
      PrismaErrorHandler.handleError(error, 'Eliminar Ciudad');
    });
  }
}
