import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { TicketStatus } from '@prisma/client';

export class ValidateTicketDto {
    @ApiProperty({
        description: 'ID del ticket',
        example: 1,
    })
    @IsNumber()
    ticketId: number;

    @ApiProperty({
        description: 'Nuevo estado del ticket',
        enum: TicketStatus,
        example: 'BOARDED',
    })
    @IsEnum(TicketStatus)
    status: TicketStatus;

    @ApiProperty({
        description: 'Código QR del ticket (opcional)',
        example: 'QR123456789',
        required: false,
    })
    @IsOptional()
    @IsString()
    qrCode?: string;
} 