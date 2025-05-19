import { Module } from '@nestjs/common';
import { CooperativesController } from './cooperatives.controller';
import { CooperativesService } from './cooperatives.service';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [CooperativesController],
  providers: [CooperativesService]
})
export class CooperativesModule {}
