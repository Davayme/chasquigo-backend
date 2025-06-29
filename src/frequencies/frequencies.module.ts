import { Module } from '@nestjs/common';
import { FrequenciesService } from './services/frequencies.service';
import { FrequenciesController } from './controllers/frequencies.controller';
import { FrequenciesBusesService } from './services/frequencies-buses.service';
import { FrequenciesBusesController } from './controllers/frequencies-buses.controller';

@Module({
  controllers: [FrequenciesController, FrequenciesBusesController],
  providers: [FrequenciesService, FrequenciesBusesService],
})
export class FrequenciesModule {}
