import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Put,
    ParseIntPipe,
    Query,
  } from '@nestjs/common';
  import { CooperativesService } from './cooperatives.service';
  import { CreateCooperativeDto } from './dto/create-cooperative.dto';
  import { UpdateCooperativeDto } from './dto/update-cooperative.dto';
  
  @Controller('cooperatives')
  export class CooperativesController {
    constructor(private readonly service: CooperativesService) {}
  
    @Post()
    create(@Body() dto: CreateCooperativeDto) {
      return this.service.create(dto);
    }
  
    @Get()
    findAll() {
      return this.service.findAll();
    }
  
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
      return this.service.findOne(id);
    }
  
    @Put(':id')
    update(
      @Param('id', ParseIntPipe) id: number,
      @Query('userId', ParseIntPipe) userId: number,
      @Body() dto: UpdateCooperativeDto,
    ) {
      return this.service.update(id, userId, dto);
    }
  
    @Delete(':id')
    remove(
      @Param('id', ParseIntPipe) id: number,
      @Query('userId', ParseIntPipe) userId: number,
    ) {
      return this.service.remove(id, userId);
    }
  
    @Get(':id/buses')
    getBuses(@Param('id', ParseIntPipe) id: number) {
      return this.service.getBusesByCooperativeId(id);
    }
  }
  