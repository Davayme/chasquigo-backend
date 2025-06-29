import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { FrequenciesBusesService } from "../services/frequencies-buses.service";
import { ApiOperation, ApiParam, ApiResponse } from "@nestjs/swagger";


@Controller("frequencies-buses")

export class FrequenciesBusesController {
    constructor(private readonly frequenciesBusesService: FrequenciesBusesService) { }
    @Get('bus-seats/:routeSheetDetailId')
    @ApiOperation({
        summary: 'Obtener distribución de asientos de un bus para una ruta específica',
        description: 'Devuelve la configuración de asientos del bus, indicando cuáles están ocupados y disponibles. Para buses de 2 pisos, divide automáticamente los asientos.'
    })
    @ApiParam({
        name: 'routeSheetDetailId',
        description: 'ID del detalle de hoja de ruta',
        type: 'number',
        example: 1
    })
    @ApiResponse({
        status: 200,
        description: 'Distribución de asientos obtenida exitosamente',
        schema: {
            type: 'object',
            properties: {
                busInfo: {
                    type: 'object',
                    properties: {
                        id: { type: 'number', example: 1 },
                        licensePlate: { type: 'string', example: 'ABC-123' },
                        chassisBrand: { type: 'string', example: 'Mercedes-Benz' },
                        bodyworkBrand: { type: 'string', example: 'Marcopolo' },
                        photo: { type: 'string', example: 'https://example.com/bus-photo.jpg' },
                        busType: {
                            type: 'object',
                            properties: {
                                id: { type: 'number', example: 1 },
                                name: { type: 'string', example: 'Ejecutivo' },
                                floorCount: { type: 'number', example: 1 },
                                capacity: { type: 'number', example: 40 }
                            }
                        }
                    }
                },
                routeInfo: {
                    type: 'object',
                    properties: {
                        routeSheetDetailId: { type: 'number', example: 1 },
                        date: { type: 'string', example: '2025-06-23' },
                        frequency: {
                            type: 'object',
                            properties: {
                                id: { type: 'number', example: 1 },
                                departureTime: { type: 'string', example: '08:30:00' },
                                originCity: { type: 'string', example: 'Quito' },
                                destinationCity: { type: 'string', example: 'Guayaquil' }
                            }
                        }
                    }
                },
                seatsLayout: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            floor: { type: 'number', example: 1 },
                            seats: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'number', example: 1 },
                                        number: { type: 'string', example: '1A' },
                                        type: { type: 'string', enum: ['NORMAL', 'VIP'], example: 'NORMAL' },
                                        location: { type: 'string', enum: ['ventana', 'pasillo'], example: 'ventana' },
                                        isOccupied: { type: 'boolean', example: false },
                                        occupiedBy: {
                                            type: 'object',
                                            properties: {
                                                ticketId: { type: 'number', example: 123 },
                                                passengerType: { type: 'string', example: 'NORMAL' },
                                                passengerName: { type: 'string', example: 'Juan Pérez' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                availability: {
                    type: 'object',
                    properties: {
                        normal: {
                            type: 'object',
                            properties: {
                                total: { type: 'number', example: 32 },
                                available: { type: 'number', example: 25 },
                                occupied: { type: 'number', example: 7 }
                            }
                        },
                        vip: {
                            type: 'object',
                            properties: {
                                total: { type: 'number', example: 8 },
                                available: { type: 'number', example: 6 },
                                occupied: { type: 'number', example: 2 }
                            }
                        }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 404, description: 'Ruta no encontrada' })
    @ApiResponse({ status: 400, description: 'ID de ruta inválido' })
    getBusSeats(@Param('routeSheetDetailId', ParseIntPipe) routeSheetDetailId: number) {
        return this.frequenciesBusesService.getBusSeats(routeSheetDetailId);
    }

    @Get('bus-seats-mock/:routeSheetDetailId')
    @ApiOperation({
        summary: '🧪 [MOCK] Obtener distribución de asientos con datos estáticos',
        description: 'Endpoint temporal que devuelve datos estáticos de asientos para pruebas del frontend. Simula bus de 2 pisos con 40 asientos.'
    })
    @ApiParam({
        name: 'routeSheetDetailId',
        description: 'ID del detalle de hoja de ruta (para referencia)',
        type: 'number',
        example: 1
    })
    @ApiResponse({
        status: 200,
        description: 'Datos estáticos de asientos devueltos exitosamente'
    })
    @ApiResponse({ status: 400, description: 'ID de ruta inválido' })
    getBusSeatsMock(@Param('routeSheetDetailId', ParseIntPipe) routeSheetDetailId: number) {
        return this.frequenciesBusesService.getBusSeatsMock(routeSheetDetailId);
    }

}