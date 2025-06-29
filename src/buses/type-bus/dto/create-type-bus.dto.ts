import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDecimal, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateTypeBusDto {
  @ApiProperty({
    description: 'Nombre del tipo de bus',
    example: 'Tipo A',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción del tipo de bus',
    example: 'Descripción del tipo de bus',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Número de pisos del tipo de bus',
    example: 2,
  })
  @IsInt()
  @Min(1)
  @Max(2)
  floorCount: number;

  @ApiProperty({
    description: 'Número de asientos del primer piso',
    example: 20,
  })
  @IsInt()
  @Min(0)
  seatsFloor1: number;

  @ApiProperty({
    description: 'Número de asientos del segundo piso',
    example: 20,
  })
  @IsInt()
  @Min(0)
  seatsFloor2: number;

  @ApiProperty({
    description: 'Precio adicional',
    example: '2.00',
  })
  @IsDecimal()
  @IsNotEmpty()
  aditionalPrice: string;
}
