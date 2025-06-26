import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { CreateTicketDto } from "src/tickets/dto/req/create-ticket.dto";

export class CreatePaymentDto {
    @ApiProperty({
        description: 'ID del usuario',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    userId: number;

    @ApiProperty({
        description: 'ID de la hoja de ruta',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    routeSheetId: number;

    @ApiProperty({
        description: 'nombre de la parada de origen',
        example: 'Ambato',
    })
    @IsString()
    @IsNotEmpty()
    originStop: string;

    @ApiProperty({
        description: 'nombre de la parada de destino',
        example: 'Pelileo',
    })
    @IsString()
    @IsNotEmpty()
    destinationStop: string;
    
    @ApiProperty({
        description: 'Método de pago',
        example: 'Stripe',
    })
    @IsString()
    @IsNotEmpty()
    method: string;

    tickets: CreateTicketDto[];
}
