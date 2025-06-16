import { IsArray, IsDateString, IsNumber, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRouteSheetDto {
  @ApiProperty({ description: 'ID de la cooperativa' })
  @IsNumber()
  @IsNotEmpty()
  cooperativeId: number;

  @ApiProperty({ description: 'Fecha de inicio de la hoja de ruta', type: String, format: 'date-time', example: '2025-06-15T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty({ description: 'Fecha de fin de la hoja de ruta', type: String, format: 'date-time', example: '2025-06-25T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  endDate: Date;

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
    example: [101, 102, 103]
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  busIds: number[];

  @ApiProperty({ 
    description: 'Estado de la hoja de ruta', 
    example: 'Activo, Pendiente, Completado, Cancelado',
    required: false
  })
  @IsString()
  @IsOptional()
  status?: string;
}