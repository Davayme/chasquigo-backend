import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Delete,
  Param,
  ParseIntPipe,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateCooperativeDto } from './dto/req/create-cooperative.dto';
import { CooperativeResponseDto } from './dto/res/cooperative-response.dto';
import { CooperativesService } from './cooperatives.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UpdateCooperativeDto } from './dto/req/update-cooperative.dto';

@ApiTags('cooperativas')
@Controller('cooperatives')
export class CooperativesController {
  constructor(private readonly service: CooperativesService) { }

  @Post()
 /*  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin') */
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Crear una nueva cooperativa' })
  @ApiResponse({
    status: 201,
    description: 'Cooperativa creada correctamente',
    type: CooperativeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Nombre ya registrado' })
  create(@Body() dto: CreateCooperativeDto) {
    return this.service.create(dto);
  }

  @Get()
 /*  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT') */
  @ApiOperation({ summary: 'Obtener todas las cooperativas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cooperativas',
    type: [CooperativeResponseDto],
  })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  /* @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT') */
  @ApiOperation({ summary: 'Obtener una cooperativa por ID' })
  @ApiResponse({
    status: 200,
    description: 'Cooperativa encontrada',
    type: CooperativeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Cooperativa no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Put(':id')
  /* @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin') */
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Actualizar cooperativa' })
  @ApiResponse({
    status: 200,
    description: 'Cooperativa actualizada correctamente',
    type: CooperativeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Cooperativa no encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateCooperativeDto,
  ) {
    return this.service.update(id, userId, dto);
  }

  @Delete(':id')
 /*  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin') */
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Eliminar una cooperativa' })
  @ApiResponse({ status: 200, description: 'Cooperativa eliminada' })
  @ApiResponse({ status: 404, description: 'Cooperativa no encontrada' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.service.remove(id, userId);
  }

  @Get(':id/buses')
 /*  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT') */
  @ApiOperation({ summary: 'Obtener los buses de una cooperativa' })
  @ApiResponse({ status: 200, description: 'Lista de buses' })
  @ApiResponse({ status: 404, description: 'Cooperativa no encontrada' })
  getBuses(@Param('id', ParseIntPipe) id: number) {
    return this.service.getBusesByCooperativeId(id);
  }
}
