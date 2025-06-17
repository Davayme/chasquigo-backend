import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDriverDto: CreateDriverDto) {
    const hashedPassword = await bcrypt.hash(createDriverDto.password, 10);

    const driver = await this.prisma.user.create({
      data: {
        ...createDriverDto,
        password: hashedPassword,
        role: Role.DRIVER,
      },
      select: {
        id: true,
        idNumber: true,
        documentType: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        cooperativeId: true,
        isDeleted: true,
      },
    });

    return driver;
  }

  async findAll(cooperativeId: number) {
    const drivers = await this.prisma.user.findMany({
      where: {
        cooperativeId,
        role: Role.DRIVER,
        isDeleted: false,
      },
      select: {
        id: true,
        idNumber: true,
        documentType: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        cooperativeId: true,
        isDeleted: true,
      },
    });

    return drivers;
  }

  async findOne(id: number) {
    const driver = await this.prisma.user.findFirst({
      where: {
        id,
        role: Role.DRIVER,
        isDeleted: false,
      },
      select: {
        id: true,
        idNumber: true,
        documentType: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        cooperativeId: true,
        isDeleted: true,
      },
    });

    if (!driver) {
      throw new NotFoundException(`Conductor con ID ${id} no encontrado`);
    }

    return driver;
  }

  async update(id: number, updateDriverDto: UpdateDriverDto) {
    const driver = await this.findOne(id);

    const data: any = { ...updateDriverDto };
    if (updateDriverDto.password) {
      data.password = await bcrypt.hash(updateDriverDto.password, 10);
    }

    const updatedDriver = await this.prisma.user.update({
      where: { id: driver.id },
      data,
      select: {
        id: true,
        idNumber: true,
        documentType: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        cooperativeId: true,
        isDeleted: true,
      },
    });

    return updatedDriver;
  }

  async remove(id: number) {
    const driver = await this.findOne(id);

    await this.prisma.user.update({
      where: { id: driver.id },
      data: { isDeleted: true },
    });

    return { message: 'Conductor eliminado exitosamente' };
  }
}