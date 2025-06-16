// src/buses/dto/create-bus.dto.ts
import { IsInt, IsString, IsArray, IsNotEmpty, IsOptional, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BusSeatDto } from './bus-seat.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBusDto {
  @ApiProperty({ 
    description: 'ID de la cooperativa a la que pertenece el bus',
    example: 1
  })
  @IsInt()
  @IsNotEmpty()
  cooperativeId: number;

  @ApiProperty({ 
    description: 'Placa del bus',
    example: 'ABC-1234'
  })
  @IsString()
  @IsNotEmpty()
  licensePlate: string;

  @ApiProperty({ 
    description: 'Marca del chasis',
    example: 'Mercedes-Benz'
  })
  @IsString()
  @IsNotEmpty()
  chassisBrand: string;

  @ApiProperty({ 
    description: 'Marca de la carrocería',
    example: 'Marcopolo'
  })
  @IsString()
  @IsNotEmpty()
  bodyworkBrand: string;

  @ApiProperty({ 
    description: 'URLs de las fotografías del bus',
    example: 'https://ejemplo.com/foto1.jpg'
  })
  @IsString()
  photo: string;

  @ApiProperty({ 
    description: 'Días de parada (descanso)',
    example: 1,
    minimum: 0,
    required: false
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  stoppageDays?: number;

  @ApiProperty({ 
    description: 'ID del tipo de bus',
    example: 1
  })
  @IsInt()
  @IsNotEmpty()
  busTypeId: number;

  @ApiProperty({ 
    description: 'Lista de asientos del bus',
    type: [BusSeatDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BusSeatDto)
  seats: BusSeatDto[];
}