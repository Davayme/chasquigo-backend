import { ApiProperty } from "@nestjs/swagger";
import { PassengerType, SeatType } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsNumber } from "class-validator";

export class CreateTicketDto {
    @ApiProperty({
        description: 'ID del asiento',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    seatId: number;

    @ApiProperty({
        description: 'Tipo de asiento',
        example: 'NORMAL',
        enum: SeatType,
    })
    @IsEnum(SeatType)
    @IsNotEmpty()
    seatType: SeatType;
    
    @ApiProperty({
        description: 'Tipo de pasajero',
        example: 'NORMAL',
        enum: PassengerType,
    })
    @IsEnum(PassengerType)
    @IsNotEmpty()
    passengerType: PassengerType;

    @ApiProperty({
        description: 'Precio',
        example: '3.50',
    })
    price: string;
    @ApiProperty({
        description: 'Descuento',
        example: '0',
    })
    discount: string;

    
}
