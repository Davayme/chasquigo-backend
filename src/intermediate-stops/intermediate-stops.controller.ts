import { Controller, Get, Post, Body, Patch, Param, Delete, Put, ParseIntPipe } from '@nestjs/common';
import { IntermediateStopsService } from './intermediate-stops.service';
import { CreateIntermediateStopDto } from './dto/req/create-intermediate-stop.dto';
import { UpdateIntermediateStopDto } from './dto/req/update-intermediate-stop.dto';
import { GetRouteCitiesDto } from './dto/req/get-route-cities.dto';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@Controller('intermediate-stops')
export class IntermediateStopsController {
  constructor(private readonly intermediateStopsService: IntermediateStopsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una parada intermedia' })
  @ApiResponse({
    status: 201,
    description: 'Parada intermedia creada exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos o incompletos' })
  @ApiResponse({ status: 409, description: 'Conflicto, posiblemente nombre duplicado' })
  create(@Body() createIntermediateStopDto: CreateIntermediateStopDto) {
    return this.intermediateStopsService.create(createIntermediateStopDto);
  }

  @Get('frequency/:frequencyId')
  @ApiOperation({ summary: 'Obtener todas las paradas intermedias' })
  @ApiParam({ name: 'frequencyId', description: 'ID de la frecuencia', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Paradas intermedias obtenidas exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Parada intermedia no encontrada' })
  findAll(@Param('frequencyId', ParseIntPipe) frequencyId: number) {
    return this.intermediateStopsService.findAll(frequencyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una parada intermedia por ID' })
  @ApiResponse({
    status: 200,
    description: 'Parada intermedia obtenida exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Parada intermedia no encontrada' })
  findOne(@Param('id') id: string) {
    return this.intermediateStopsService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una parada intermedia' })
  @ApiParam({ name: 'id', description: 'ID de la parada intermedia', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Parada intermedia actualizada exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Parada intermedia no encontrada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o incompletos' })
  update(@Param('id') id: string, @Body() updateIntermediateStopDto: UpdateIntermediateStopDto) {
    return this.intermediateStopsService.update(+id, updateIntermediateStopDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una parada intermedia' })
  @ApiParam({ name: 'id', description: 'ID de la parada intermedia', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Parada intermedia eliminada exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Parada intermedia no encontrada' })
  remove(@Param('id') id: string) {
    return this.intermediateStopsService.remove(+id);
  }

  @Post('ciudades')
  @ApiOperation({ summary: 'Obtener ciudades intermedias' })
  @ApiResponse({
    status: 200,
    description: 'Ciudades intermedias obtenidas exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Ciudades intermedias no encontradas' })
  obtenerCiudadesIntermedias(@Body() getRouteCitiesDto: GetRouteCitiesDto) {
    return this.intermediateStopsService.obtenerCiudadesIntermedias(getRouteCitiesDto);
  }
}
