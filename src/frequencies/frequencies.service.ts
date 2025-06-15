import { Injectable } from '@nestjs/common';
import { CreateFrequencyDto } from './dto/req/create-frequency.dto';
import { UpdateFrequencyDto } from './dto/req/update-frequency.dto';

@Injectable()
export class FrequenciesService {
  create(createFrequencyDto: CreateFrequencyDto) {
    return 'This action adds a new frequency';
  }

  findAll() {
    return `This action returns all frequencies`;
  }

  findOne(id: number) {
    return `This action returns a #${id} frequency`;
  }

  update(id: number, updateFrequencyDto: UpdateFrequencyDto) {
    return `This action updates a #${id} frequency`;
  }

  remove(id: number) {
    return `This action removes a #${id} frequency`;
  }
}
