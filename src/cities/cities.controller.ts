import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { CitiesService } from './cities.service';
import { CreateCityDto } from './dto/req/create-city.dto';
import { UpdateCityDto } from './dto/req/update-city.dto';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva ciudad' })
  @ApiResponse({
    status: 201,
    description: 'Ciudad creada exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos o incompletos' })
  @ApiResponse({
    status: 409,
    description: 'Conflicto, posiblemente nombre duplicado',
  })
  create(@Body() createCityDto: CreateCityDto) {
    return this.citiesService.create(createCityDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las ciudades' })
  @ApiResponse({
    status: 200,
    description: 'Lista de ciudades',
  })
  findAll() {
    return this.citiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una ciudad por ID' })
  @ApiParam({ name: 'id', description: 'ID de la ciudad', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Ciudad obtenida exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Ciudad no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.citiesService.findOne(id);
  }

  @Get('/name/:name')
  @ApiOperation({ summary: 'Obtener una ciudad por nombre' })
  @ApiParam({ name: 'name', description: 'Nombre de la ciudad', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Ciudad obtenida exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Ciudad no encontrada' })
  findByName(@Param('name') name: string) {
    return this.citiesService.findByName(name);
  }


  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una ciudad por ID' })
  @ApiParam({ name: 'id', description: 'ID de la ciudad', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Ciudad actualizada exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Ciudad no encontrada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o incompletos' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCityDto: UpdateCityDto,
  ) {
    return this.citiesService.update(id, updateCityDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar lógicamente una ciudad por ID' })
  @ApiParam({ name: 'id', description: 'ID de la ciudad', type: 'number' })
  @ApiResponse({ status: 200, description: 'Ciudad eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Ciudad no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.citiesService.remove(id);
  }
}
