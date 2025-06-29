import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { TypeBusService } from './type-bus.service';
import { CreateTypeBusDto } from './dto/create-type-bus.dto';
import { UpdateTypeBusDto } from './dto/update-type-bus.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('tipos-bus')
@Controller('type-bus')
export class TypeBusController {
  constructor(private readonly typeBusService: TypeBusService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo tipo de bus' })
  @ApiResponse({ 
    status: 201, 
    description: 'El tipo de bus ha sido creado exitosamente' 
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos o incompletos' })
  create(@Body() dto: CreateTypeBusDto) {
    return this.typeBusService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los tipos de bus' })
  @ApiResponse({ 
    status: 200, 
    description: 'Todos los tipos de bus han sido obtenidos exitosamente' 
  })
  @ApiResponse({ status: 404, description: 'No se encontraron tipos de bus' })
  findAll() {
    return this.typeBusService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un tipo de bus por ID' })
  @ApiParam({ name: 'id', description: 'ID del tipo de bus', type: 'number' })
  @ApiResponse({ 
    status: 200, 
    description: 'El tipo de bus ha sido obtenido exitosamente' 
  })
  @ApiResponse({ status: 404, description: 'Tipo de bus no encontrado' })
  findOne(@Param('id' , ParseIntPipe) id: number) {
    return this.typeBusService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un tipo de bus existente' })
  @ApiParam({ name: 'id', description: 'ID del tipo de bus', type: 'number' })
  @ApiResponse({ 
    status: 200, 
    description: 'El tipo de bus ha sido actualizado exitosamente' 
  })
  @ApiResponse({ status: 404, description: 'Tipo de bus no encontrado' })
  update(@Param('id' , ParseIntPipe) id: number, @Body() dto: UpdateTypeBusDto) {
    return this.typeBusService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un tipo de bus existente' })
  @ApiParam({ name: 'id', description: 'ID del tipo de bus', type: 'number' })
  @ApiResponse({ 
    status: 200, 
    description: 'El tipo de bus ha sido eliminado exitosamente' 
  })
  @ApiResponse({ status: 404, description: 'Tipo de bus no encontrado' })
  remove(@Param('id' , ParseIntPipe) id: number) {
    return this.typeBusService.remove(id);
  }
}
