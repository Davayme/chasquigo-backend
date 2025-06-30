import { IsArray, IsDateString, IsNumber, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRouteSheetDto {
  @ApiProperty({ description: 'ID de la cooperativa' })
  @IsNumber()
  @IsNotEmpty()
  cooperativeId: number;

  @ApiProperty({ description: 'Fecha de inicio de la hoja de ruta', type: String, format: 'date-time', example: '2025-06-15' })
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ 
    description: 'IDs de las frecuencias que se incluirán en la hoja de ruta', 
    type: [Number],
    example: [1, 2, 3]
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  frequencyIds: number[];

  @ApiProperty({ 
    description: 'IDs de los buses que se asignarán a la hoja de ruta',
    type: [Number],
    example: [1, 2, 3]
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  busIds: number[];

}