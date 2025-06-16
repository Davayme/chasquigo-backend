import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Put } from '@nestjs/common';
import { BusesService } from './buses.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('buses')
@Controller('buses')
export class BusesController {
  constructor(private readonly busesService: BusesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo bus con sus asientos' })
  @ApiResponse({ 
    status: 201, 
    description: 'El bus ha sido creado exitosamente con sus asientos' 
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos o incompletos' })
  @ApiResponse({ status: 409, description: 'Conflicto, posiblemente placa duplicada' })
  create(@Body() createBusDto: CreateBusDto) {
    return this.busesService.create(createBusDto);
  }

  @Get('cooperative/:id')
  @ApiOperation({ summary: 'Obtener todos los buses activos' })
  @ApiParam({ name: 'id', description: 'ID de la cooperativa', type: 'number' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de buses activos con sus asientos' 
  })
  findAll(@Param('id', ParseIntPipe) id: number) {
    return this.busesService.findAll(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un bus específico por ID' })
  @ApiParam({ name: 'id', description: 'ID del bus', type: 'number' })
  @ApiResponse({ status: 200, description: 'Detalles del bus solicitado' })
  @ApiResponse({ status: 404, description: 'Bus no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.busesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un bus existente y sus asientos' })
  @ApiParam({ name: 'id', description: 'ID del bus', type: 'number' })
  @ApiResponse({ status: 200, description: 'Bus actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Bus no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateBusDto: UpdateBusDto
  ) {
    return this.busesService.update(id, updateBusDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar lógicamente un bus y sus asientos' })
  @ApiParam({ name: 'id', description: 'ID del bus', type: 'number' })
  @ApiResponse({ status: 200, description: 'Bus eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Bus no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.busesService.remove(id);
  }
}