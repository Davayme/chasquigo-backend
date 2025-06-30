import { IsNumber, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetFrequenciesDto {
  @ApiProperty({ description: 'ID de la hoja de ruta', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  routeSheetHeaderId: number;

  @ApiProperty({ description: 'ID de la frecuencia', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  frequencyId: number;

  @ApiProperty({
    description: 'Fecha objetivo',
    type: String,
    format: 'date-time',
    example: '2025-06-30',
  })
  @IsString()
  @IsNotEmpty()
  targetDate: string;
}


export class GetRouteSheetScheduleDto {
  @ApiProperty({ description: 'ID de la hoja de ruta', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  routeSheetHeaderId: number;

  @ApiProperty({ description: 'Fecha de inicio del rango', example: '2025-06-30' })
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'Fecha de fin del rango', example: '2025-06-30' })
  @IsString()
  @IsNotEmpty()
  endDate: string;
}