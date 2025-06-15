import { Module } from '@nestjs/common';
import { IntermediateStopsService } from './intermediate-stops.service';
import { IntermediateStopsController } from './intermediate-stops.controller';

@Module({
  controllers: [IntermediateStopsController],
  providers: [IntermediateStopsService],
})
export class IntermediateStopsModule {}
