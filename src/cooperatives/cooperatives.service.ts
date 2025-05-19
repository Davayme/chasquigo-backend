import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CooperativesService {

    constructor(private readonly prismaService: PrismaService) { }

    async getAllCooperatives() {
        return this.prismaService.cooperative.findMany();
    }
}
