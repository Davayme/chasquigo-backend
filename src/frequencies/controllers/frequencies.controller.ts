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
import { FrequenciesService } from '../services/frequencies.service';
import { CreateFrequencyDto } from '../dto/req/create-frequency.dto';
import { UpdateFrequencyDto } from '../dto/req/update-frequency.dto';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SearchRoutesDto } from '../dto/req/search-route.dto';

@Controller('frequencies')
export class FrequenciesController {
  constructor(private readonly frequenciesService: FrequenciesService) { }

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

  // @Get('search')
  // @ApiOperation({
  //   summary: 'Buscar rutas disponibles para la aplicación móvil',
  //   description: 'Busca rutas disponibles según ciudad origen, destino y fecha. Considera zona horaria de Ecuador (UTC-5)'
  // })
  // @ApiQuery({ name: 'originCityId', description: 'ID de la ciudad de origen', type: 'number', example: 1 })
  // @ApiQuery({ name: 'destinationCityId', description: 'ID de la ciudad de destino', type: 'number', example: 2 })
  // @ApiQuery({ name: 'date', description: 'Fecha de viaje (YYYY-MM-DD)', type: 'string', example: '2025-06-23' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Rutas encontradas exitosamente',
  //   schema: {
  //     type: 'array',
  //     items: {
  //       type: 'object',
  //       properties: {
  //         routeSheetDetailId: { type: 'number', example: 1 },
  //         date: { type: 'string', example: '2025-06-23' },
  //         frequency: {
  //           type: 'object',
  //           properties: {
  //             id: { type: 'number', example: 1 },
  //             departureTime: { type: 'string', example: '08:30:00' },
  //             status: { type: 'string', example: 'activo' },
  //             antResolution: { type: 'string', example: 'ANT-2025-001' }
  //           }
  //         },
  //         seatsAvailability: {
  //           type: 'object',
  //           properties: {
  //             normal: {
  //               type: 'object',
  //               properties: {
  //                 available: { type: 'number', example: 25 },
  //                 total: { type: 'number', example: 32 },
  //                 sold: { type: 'number', example: 7 }
  //               }
  //             }
  //           }
  //         }
  //       }
  //     }
  //   }
  // })
  // @ApiResponse({ status: 404, description: 'No se encontraron rutas disponibles' })
  // @ApiResponse({ status: 400, description: 'Parámetros inválidos' })
  // searchRoutes(@Query() searchRoutesDto: SearchRoutesDto) {
  //   return this.frequenciesService.searchRoutes(searchRoutesDto);
  // }


  // @Get('search-mock')
  // @ApiOperation({
  //   summary: '🧪 [MOCK] Buscar rutas con datos estáticos para pruebas',
  //   description: 'Endpoint temporal que devuelve datos estáticos para pruebas del frontend. Simula 3 rutas diferentes con información completa.'
  // })
  // @ApiQuery({ name: 'originCityId', description: 'ID de la ciudad de origen', type: 'number', example: 1 })
  // @ApiQuery({ name: 'destinationCityId', description: 'ID de la ciudad de destino', type: 'number', example: 2 })
  // @ApiQuery({ name: 'date', description: 'Fecha de viaje (YYYY-MM-DD)', type: 'string', example: '2025-06-23' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Datos estáticos devueltos exitosamente',
  //   schema: {
  //     type: 'array',
  //     items: {
  //       type: 'object',
  //       properties: {
  //         routeSheetDetailId: { type: 'number', example: 1 },
  //         date: { type: 'string', example: '2025-06-23' },
  //         frequency: {
  //           type: 'object',
  //           properties: {
  //             id: { type: 'number', example: 1 },
  //             departureTime: { type: 'string', example: '08:30:00' },
  //             status: { type: 'string', example: 'activo' },
  //             antResolution: { type: 'string', example: 'ANT-2025-001' },
  //             originCity: {
  //               type: 'object',
  //               properties: {
  //                 id: { type: 'number', example: 1 },
  //                 name: { type: 'string', example: 'Quito' },
  //                 province: { type: 'string', example: 'PICHINCHA' }
  //               }
  //             },
  //             destinationCity: {
  //               type: 'object',
  //               properties: {
  //                 id: { type: 'number', example: 2 },
  //                 name: { type: 'string', example: 'Guayaquil' },
  //                 province: { type: 'string', example: 'GUAYAS' }
  //               }
  //             },
  //             intermediateStops: {
  //               type: 'array',
  //               items: {
  //                 type: 'object',
  //                 properties: {
  //                   id: { type: 'number', example: 1 },
  //                   order: { type: 'number', example: 1 },
  //                   city: {
  //                     type: 'object',
  //                     properties: {
  //                       id: { type: 'number', example: 3 },
  //                       name: { type: 'string', example: 'Santo Domingo' },
  //                       province: { type: 'string', example: 'SANTO_DOMINGO_DE_LOS_TSACHILAS' }
  //                     }
  //                   }
  //                 }
  //               }
  //             }
  //           }
  //         },
  //         bus: {
  //           type: 'object',
  //           properties: {
  //             id: { type: 'number', example: 1 },
  //             licensePlate: { type: 'string', example: 'ABC-123' },
  //             chassisBrand: { type: 'string', example: 'Mercedes-Benz' },
  //             bodyworkBrand: { type: 'string', example: 'Marcopolo' },
  //             photo: { type: 'string', example: 'https://example.com/bus-photo.jpg' },
  //             stoppageDays: { type: 'number', example: 2 },
  //             busType: {
  //               type: 'object',
  //               properties: {
  //                 id: { type: 'number', example: 1 },
  //                 name: { type: 'string', example: 'Ejecutivo' },
  //                 floorCount: { type: 'number', example: 1 },
  //                 capacity: { type: 'number', example: 40 }
  //               }
  //             }
  //           }
  //         },
  //         cooperative: {
  //           type: 'object',
  //           properties: {
  //             id: { type: 'number', example: 1 },
  //             name: { type: 'string', example: 'Transportes Express' },
  //             logo: { type: 'string', example: 'https://example.com/logo.png' },
  //             phone: { type: 'string', example: '0987654321' },
  //             email: { type: 'string', example: 'info@transportesexpress.com' }
  //           }
  //         },
  //         seatsAvailability: {
  //           type: 'object',
  //           properties: {
  //             normal: {
  //               type: 'object',
  //               properties: {
  //                 available: { type: 'number', example: 25 },
  //                 total: { type: 'number', example: 32 },
  //                 sold: { type: 'number', example: 7 }
  //               }
  //             },
  //             vip: {
  //               type: 'object',
  //               properties: {
  //                 available: { type: 'number', example: 6 },
  //                 total: { type: 'number', example: 8 },
  //                 sold: { type: 'number', example: 2 }
  //               }
  //             }
  //           }
  //         },
  //         pricing: {
  //           type: 'object',
  //           properties: {
  //             normalSeat: {
  //               type: 'object',
  //               properties: {
  //                 basePrice: { type: 'number', example: 25.00 },
  //                 discounts: {
  //                   type: 'object',
  //                   properties: {
  //                     CHILD: { type: 'number', example: 12.50 },
  //                     SENIOR: { type: 'number', example: 18.75 },
  //                     HANDICAPPED: { type: 'number', example: 12.50 }
  //                   }
  //                 }
  //               }
  //             },
  //             vipSeat: {
  //               type: 'object',
  //               properties: {
  //                 basePrice: { type: 'number', example: 35.00 },
  //                 discounts: {
  //                   type: 'object',
  //                   properties: {
  //                     CHILD: { type: 'number', example: 17.50 },
  //                     SENIOR: { type: 'number', example: 26.25 },
  //                     HANDICAPPED: { type: 'number', example: 17.50 }
  //                   }
  //                 }
  //               }
  //             }
  //           }
  //         },
  //         status: { type: 'string', example: 'disponible' },
  //         duration: { type: 'string', example: '4h 30min' },
  //         estimatedArrival: { type: 'string', example: '13:00:00' }
  //       }
  //     }
  //   }
  // })
  // @ApiResponse({ status: 400, description: 'Parámetros inválidos' })
  // searchRoutesMock(@Query() searchRoutesDto: SearchRoutesDto) {
  //   return this.frequenciesService.searchRoutesMock(searchRoutesDto);
  // }
  
  @Get()
  @ApiOperation({ summary: 'Obtener todas las frecuencias de una cooperativa' })
  @ApiResponse({
    status: 200,
    description: 'Lista de frecuencias ',
  })
  @ApiResponse({ status: 404, description: 'No se encontraron frecuencias' })
  findByCooperative(@Query('cooperativeId', ParseIntPipe) cooperativeId: number) {
    return this.frequenciesService.findAllByCooperative(cooperativeId);
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
