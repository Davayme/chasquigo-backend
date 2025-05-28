import { Module } from '@nestjs/common';
import { CooperativesController } from './cooperatives.controller';
import { CooperativesService } from './cooperatives.service';
import { CommonModule } from 'src/common/common.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [CommonModule],
  controllers: [CooperativesController],
  providers: [CooperativesService, PrismaService]
})
export class CooperativesModule {}
