import { Controller, Get, Post, Body, Put, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Conductores')
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo conductor' })
  @ApiResponse({ status: 201, description: 'Conductor creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(@Body() createDriverDto: CreateDriverDto) {
    return this.driversService.create(createDriverDto);
  }

  @Get(':cooperativeId')
  @ApiOperation({ summary: 'Obtener todos los conductores de una cooperativa' })
  @ApiParam({ name: 'cooperativeId', description: 'ID de la cooperativa' })
  @ApiResponse({ status: 200, description: 'Lista de conductores obtenida exitosamente' })
  findAll(@Param('cooperativeId', ParseIntPipe) cooperativeId: number) {
    return this.driversService.findAll(cooperativeId);
  }

  @Get('one/:id')
  @ApiOperation({ summary: 'Obtener un conductor específico' })
  @ApiParam({ name: 'id', description: 'ID del conductor' })
  @ApiResponse({ status: 200, description: 'Conductor encontrado exitosamente' })
  @ApiResponse({ status: 404, description: 'Conductor no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.driversService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un conductor' })
  @ApiParam({ name: 'id', description: 'ID del conductor' })
  @ApiResponse({ status: 200, description: 'Conductor actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Conductor no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDriverDto: UpdateDriverDto,
  ) {
    return this.driversService.update(id, updateDriverDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un conductor' })
  @ApiParam({ name: 'id', description: 'ID del conductor' })
  @ApiResponse({ status: 200, description: 'Conductor eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Conductor no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.driversService.remove(id);
  }
}