import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchRoutesDto {
  @ApiProperty({
    description: 'ID de la ciudad de origen',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  originCityId: number;

  @ApiProperty({
    description: 'ID de la ciudad de destino',
    example: 2,
  })
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  destinationCityId: number;

  @ApiProperty({
    description: 'Fecha de viaje en formato YYYY-MM-DD',
    example: '2025-06-23',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;
}