import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class GetDriverTripsDto {
    @ApiProperty({
        description: 'ID del conductor',
        example: 1,
    })
    @IsNumber()
    driverId: number;

    @ApiProperty({
        description: 'ID de la cooperativa (opcional)',
        example: 1,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    cooperativeId?: number;
} 