import { Injectable } from '@nestjs/common';
import { CreateIntermediateStopDto } from './dto/create-intermediate-stop.dto';
import { UpdateIntermediateStopDto } from './dto/update-intermediate-stop.dto';

@Injectable()
export class IntermediateStopsService {
  create(createIntermediateStopDto: CreateIntermediateStopDto) {
    return 'This action adds a new intermediateStop';
  }

  findAll() {
    return `This action returns all intermediateStops`;
  }

  findOne(id: number) {
    return `This action returns a #${id} intermediateStop`;
  }

  update(id: number, updateIntermediateStopDto: UpdateIntermediateStopDto) {
    return `This action updates a #${id} intermediateStop`;
  }

  remove(id: number) {
    return `This action removes a #${id} intermediateStop`;
  }
}
