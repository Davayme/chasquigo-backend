import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsNumber } from "class-validator";

export class CreateIntermediateStopDto {
    @ApiProperty({
        description: 'Nombre de la parada intermedia',
        example: 'Parada Intermedia',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'ID de la frecuencia',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    frequencyId: number;
    
    @ApiProperty({
        description: 'Orden de la parada intermedia',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    order: number;
}
