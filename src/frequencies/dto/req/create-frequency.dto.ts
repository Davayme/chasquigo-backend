import { ApiProperty } from "@nestjs/swagger";
import { Status } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsNumber, IsString, Matches } from "class-validator";

export class CreateFrequencyDto {
    @ApiProperty({
        description: 'ID de la cooperativa',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    cooperativeId: number;

    @ApiProperty({
        description: 'ID de la ciudad de origen',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    originCityId: number;

    @ApiProperty({
        description: 'ID de la ciudad de destino',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    destinationCityId: number;
    
    @ApiProperty({
        description: 'Hora de salida',
        example: '09:00',
    })
    @IsString()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
        message: 'El formato de hora debe ser HH:MM en formato 24 horas',
    })
    departureTime: string;
    
    @ApiProperty({
        description: 'Estado de la frecuencia',
        example: 'Activo',
        enum: Status,
    })
    @IsString()
    @IsNotEmpty()
    @IsEnum(Status)
    status: Status;

    @ApiProperty({
        description: 'URL de archivo de la resolución de la ANT',
        example: '/uploads/ant_resolution.pdf',
    })
    @IsString()
    @IsNotEmpty()
    antResolution: string;
}
