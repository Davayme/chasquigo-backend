import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus } from '@prisma/client';

export class TripTicketResponseDto {
    @ApiProperty({
        description: 'ID del ticket',
        example: 1,
    })
    id: number;

    @ApiProperty({
        description: 'Estado del ticket',
        enum: TicketStatus,
        example: 'PAID',
    })
    status: TicketStatus;

    @ApiProperty({
        description: 'Código QR del ticket',
        example: 'QR123456789',
    })
    qrCode: string;

    @ApiProperty({
        description: 'Fecha de compra',
        example: '2024-01-15T10:30:00Z',
    })
    purchaseDate: Date;

    @ApiProperty({
        description: 'Hora de abordaje',
        example: '2024-01-15T14:00:00Z',
        required: false,
    })
    boardingTime?: Date;

    @ApiProperty({
        description: 'Cantidad de veces escaneado',
        example: 1,
    })
    scanCount: number;

    @ApiProperty({
        description: 'Última vez escaneado',
        example: '2024-01-15T14:00:00Z',
        required: false,
    })
    lastScanTime?: Date;

    @ApiProperty({
        description: 'Cantidad de pasajeros',
        example: 2,
    })
    passengerCount: number;

    @ApiProperty({
        description: 'Precio final total',
        example: 25.50,
    })
    finalTotalPrice: number;

    @ApiProperty({
        description: 'Ciudad de origen',
        example: 'Quito',
    })
    originCity: string;

    @ApiProperty({
        description: 'Ciudad de destino',
        example: 'Guayaquil',
    })
    destinationCity: string;

    @ApiProperty({
        description: 'Información de los pasajeros',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                id: { type: 'number' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                seatNumber: { type: 'number' },
                seatType: { type: 'string' },
                passengerType: { type: 'string' },
                finalPrice: { type: 'number' },
            },
        },
    })
    passengers: Array<{
        id: number;
        firstName: string;
        lastName: string;
        seatNumber: number;
        seatType: string;
        passengerType: string;
        finalPrice: number;
    }>;

    @ApiProperty({
        description: 'Información del comprador',
        type: 'object',
        additionalProperties: true,
        properties: {
            id: { type: 'number', example: 1 },
            firstName: { type: 'string', example: 'Juan' },
            lastName: { type: 'string', example: 'Pérez' },
            email: { type: 'string', example: 'juan.perez@email.com' },
            phone: { type: 'string', example: '0991234567' },
        },
    })
    buyer: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    };
} 