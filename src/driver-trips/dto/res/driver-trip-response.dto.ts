import { ApiProperty } from '@nestjs/swagger';

export class DriverTripResponseDto {
    @ApiProperty({
        description: 'ID de la hoja de ruta',
        example: 1,
    })
    id: number;

    @ApiProperty({
        description: 'ID de la cooperativa',
        example: 1,
    })
    cooperativeId: number;

    @ApiProperty({
        description: 'Nombre de la cooperativa',
        example: 'Cooperativa Ejemplo',
    })
    cooperativeName: string;

    @ApiProperty({
        description: 'Fecha de inicio del viaje',
        example: '2024-01-15T08:00:00Z',
    })
    startDate: Date;

    @ApiProperty({
        description: 'Estado de la hoja de ruta',
        example: 'ACTIVE',
    })
    status: string;

    @ApiProperty({
        description: 'Detalles de la frecuencia',
        type: 'object',
        additionalProperties: true,
        properties: {
            id: { type: 'number', example: 1 },
            originCity: { type: 'string', example: 'Quito' },
            destinationCity: { type: 'string', example: 'Guayaquil' },
            departureTime: { type: 'string', example: '08:00' },
            antResolution: { type: 'string', example: 'ANT-2024-001' },
        },
    })
    frequency: {
        id: number;
        originCity: string;
        destinationCity: string;
        departureTime: string;
        antResolution: string;
    };

    @ApiProperty({
        description: 'Información del bus',
        type: 'object',
        additionalProperties: true,
        properties: {
            id: { type: 'number', example: 1 },
            licensePlate: { type: 'string', example: 'ABC-1234' },
            chassisBrand: { type: 'string', example: 'Mercedes' },
            bodyworkBrand: { type: 'string', example: 'Busscar' },
            busType: {
                type: 'object',
                properties: {
                    name: { type: 'string', example: 'Bus Ejecutivo' },
                    seatsFloor1: { type: 'number', example: 45 },
                    seatsFloor2: { type: 'number', example: 0 },
                },
            },
        },
    })
    bus: {
        id: number;
        licensePlate: string;
        chassisBrand: string;
        bodyworkBrand: string;
        busType: {
            name: string;
            seatsFloor1: number;
            seatsFloor2: number;
        };
    };

    @ApiProperty({
        description: 'Cantidad total de tickets',
        example: 25,
    })
    totalTickets: number;

    @ApiProperty({
        description: 'Cantidad de tickets abordados',
        example: 20,
    })
    boardedTickets: number;

    @ApiProperty({
        description: 'Cantidad de tickets pendientes',
        example: 5,
    })
    pendingTickets: number;
} 