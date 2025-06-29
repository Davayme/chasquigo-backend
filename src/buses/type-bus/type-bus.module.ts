import { Module } from '@nestjs/common';
import { TypeBusService } from './type-bus.service';
import { TypeBusController } from './type-bus.controller';

@Module({
  controllers: [TypeBusController],
  providers: [TypeBusService],
})
export class TypeBusModule {}
