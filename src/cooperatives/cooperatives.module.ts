import { Module } from '@nestjs/common';
import { CooperativesController } from './cooperatives.controller';
import { CooperativesService } from './cooperatives.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [],
  controllers: [CooperativesController],
  providers: [CooperativesService]
})
export class CooperativesModule {}
