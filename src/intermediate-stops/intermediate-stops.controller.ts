import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { IntermediateStopsService } from './intermediate-stops.service';
import { CreateIntermediateStopDto } from './dto/req/create-intermediate-stop.dto';
import { UpdateIntermediateStopDto } from './dto/req/update-intermediate-stop.dto';
import { GetRouteCitiesDto } from './dto/req/get-route-cities.dto';

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

  @Post('ciudades')
  obtenerCiudadesIntermedias(@Body() getRouteCitiesDto: GetRouteCitiesDto) {
    return this.intermediateStopsService.obtenerCiudadesIntermedias(getRouteCitiesDto);
  }
}
