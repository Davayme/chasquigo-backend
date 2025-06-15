import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { IntermediateStopsService } from './intermediate-stops.service';
import { CreateIntermediateStopDto } from './dto/create-intermediate-stop.dto';
import { UpdateIntermediateStopDto } from './dto/update-intermediate-stop.dto';

@Controller('intermediate-stops')
export class IntermediateStopsController {
  constructor(private readonly intermediateStopsService: IntermediateStopsService) {}

  @Post()
  create(@Body() createIntermediateStopDto: CreateIntermediateStopDto) {
    return this.intermediateStopsService.create(createIntermediateStopDto);
  }

  @Get()
  findAll() {
    return this.intermediateStopsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.intermediateStopsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateIntermediateStopDto: UpdateIntermediateStopDto) {
    return this.intermediateStopsService.update(+id, updateIntermediateStopDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.intermediateStopsService.remove(+id);
  }
}
