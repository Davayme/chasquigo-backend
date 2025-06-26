import { Module } from '@nestjs/common';
import { FrequenciesService } from './frequencies.service';
import { FrequenciesController } from './frequencies.controller';

@Module({
  controllers: [FrequenciesController],
  providers: [FrequenciesService],
})
export class FrequenciesModule {}
