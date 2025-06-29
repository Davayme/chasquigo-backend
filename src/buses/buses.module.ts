import { Module } from '@nestjs/common';
import { BusesService } from './buses.service';
import { BusesController } from './buses.controller';
import { CommonModule } from 'src/common/common.module';
import { TypeBusModule } from './type-bus/type-bus.module';

@Module({
  imports: [TypeBusModule],
  controllers: [BusesController],
  providers: [BusesService],
  exports: [BusesService],
})
export class BusesModule { }
