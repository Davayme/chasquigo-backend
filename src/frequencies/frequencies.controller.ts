import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  ParseIntPipe,
} from '@nestjs/common';
import { FrequenciesService } from './frequencies.service';
import { CreateFrequencyDto } from './dto/req/create-frequency.dto';
import { UpdateFrequencyDto } from './dto/req/update-frequency.dto';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@Controller('frequencies')
export class FrequenciesController {
  constructor(private readonly frequenciesService: FrequenciesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva frecuencia' })
  @ApiResponse({
    status: 201,
    description: 'Frecuencia creada exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos o incompletos' })
  @ApiResponse({ status: 409, description: 'Conflicto, posiblemente nombre duplicado' })
  create(@Body() createFrequencyDto: CreateFrequencyDto) {
    return this.frequenciesService.create(createFrequencyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las frecuencias' })
  @ApiResponse({
    status: 200,
    description: 'Lista de frecuencias',
  })
  findAll() {
    return this.frequenciesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una frecuencia por ID' })
  @ApiParam({ name: 'id', description: 'ID de la frecuencia', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Frecuencia obtenida exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Frecuencia no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.frequenciesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una frecuencia por ID' })
  @ApiParam({ name: 'id', description: 'ID de la frecuencia', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Frecuencia actualizada exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Frecuencia no encontrada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o incompletos' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFrequencyDto: UpdateFrequencyDto,
  ) {
    return this.frequenciesService.update(id, updateFrequencyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una frecuencia por ID' })
  @ApiParam({ name: 'id', description: 'ID de la frecuencia', type: 'number' })
  @ApiResponse({ status: 200, description: 'Frecuencia eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Frecuencia no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.frequenciesService.remove(id);
  }
}
