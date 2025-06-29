import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put, ParseIntPipe } from '@nestjs/common';
import { RouteSheetsService } from './route-sheets.service';
import { CreateRouteSheetDto } from './dto/req/create-route-sheet.dto';
import { UpdateRouteSheetDto } from './dto/req/update-route-sheet.dto';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@Controller('route-sheets')
export class RouteSheetsController {
  constructor(private readonly routeSheetsService: RouteSheetsService) {}

  /* @Post()
  @ApiOperation({ summary: 'Crear una nueva hoja de ruta' })
  @ApiResponse({
    status: 201,
    description: 'Hoja de ruta creada exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos o incompletos' })
  @ApiResponse({ status: 409, description: 'Conflicto, posiblemente nombre duplicado' })
  create(@Body() createRouteSheetDto: CreateRouteSheetDto) {
    return this.routeSheetsService.create(createRouteSheetDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las hojas de ruta de una cooperativa' })
  @ApiResponse({
    status: 200,
    description: 'Lista de hojas de ruta',
  })
  @ApiResponse({ status: 404, description: 'No se encontraron hojas de ruta' })
  findAll(@Query('cooperativeId', ParseIntPipe) cooperativeId: number) {
    return this.routeSheetsService.findAll(cooperativeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una hoja de ruta por ID' })
  @ApiParam({ name: 'id', description: 'ID de la hoja de ruta', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Hoja de ruta obtenida exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Hoja de ruta no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.routeSheetsService.findOne(id);
  }

  @Get('details/:id')
  @ApiOperation({ summary: 'Obtener todos los detalles de una hoja de ruta' })
  @ApiParam({ name: 'id', description: 'ID de la hoja de ruta', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Lista de detalles de hoja de ruta',
  })
  @ApiResponse({ status: 404, description: 'No se encontraron detalles de hoja de ruta' })
  findDetailsByRouteSheetHeaderId(@Param('id', ParseIntPipe) id: number) {
    return this.routeSheetsService.findDetailsByRouteSheetHeaderId(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar el estado de una hoja de ruta' })
  @ApiParam({ name: 'id', description: 'ID de la hoja de ruta', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Hoja de ruta actualizada exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Hoja de ruta no encontrada' })
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() updateRouteSheetDto: UpdateRouteSheetDto) {
    return this.routeSheetsService.updateStatus(id, updateRouteSheetDto.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una hoja de ruta' })
  @ApiParam({ name: 'id', description: 'ID de la hoja de ruta', type: 'number' })
  @ApiResponse({ status: 200, description: 'Hoja de ruta eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Hoja de ruta no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.routeSheetsService.remove(id);
  } */
}
