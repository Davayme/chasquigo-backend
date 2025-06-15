import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RouteSheetsService } from './route-sheets.service';
import { CreateRouteSheetDto } from './dto/req/create-route-sheet.dto';
import { UpdateRouteSheetDto } from './dto/req/update-route-sheet.dto';

@Controller('route-sheets')
export class RouteSheetsController {
  constructor(private readonly routeSheetsService: RouteSheetsService) {}

  @Post()
  create(@Body() createRouteSheetDto: CreateRouteSheetDto) {
    return this.routeSheetsService.create(createRouteSheetDto);
  }

  @Get()
  findAll() {
    return this.routeSheetsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.routeSheetsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRouteSheetDto: UpdateRouteSheetDto) {
    return this.routeSheetsService.update(+id, updateRouteSheetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.routeSheetsService.remove(+id);
  }
}
