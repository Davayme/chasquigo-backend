import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateCooperativeDto } from './dto/req/update-cooperative.dto';
import { CreateCooperativeDto } from './dto/req/create-cooperative.dto';

@Injectable()
export class CooperativesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCooperativeDto) {
    return this.prisma.cooperative.create({ data: dto });
  }

  async findAll() {
    return this.prisma.cooperative.findMany({
      where: { isDeleted: false },
    });
  }

  async findOne(id: number) {
    const coop = await this.prisma.cooperative.findUnique({
      where: { id },
    });

    if (!coop || coop.isDeleted) {
      throw new NotFoundException('Cooperative not found');
    }

    return coop;
  }

  async update(id: number, userId: number, dto: UpdateCooperativeDto) {
    const coop = await this.findOne(id);

    const isOwner = await this.prisma.user.findFirst({
      where: {
        id: userId,
        cooperativeId: id,
      },
    });

    if (!isOwner) {
      throw new ForbiddenException('You do not have access to update this cooperative');
    }

    return this.prisma.cooperative.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number, userId: number) {
    const coop = await this.findOne(id);

    const isOwner = await this.prisma.user.findFirst({
      where: {
        id: userId,
        cooperativeId: id,
      },
    });

    if (!isOwner) {
      throw new ForbiddenException('You do not have access to delete this cooperative');
    }

    return this.prisma.cooperative.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async getBusesByCooperativeId(id: number) {
    return this.prisma.bus.findMany({
      where: {
        cooperativeId: id,
        isDeleted: false,
      },
    });
  }
}
