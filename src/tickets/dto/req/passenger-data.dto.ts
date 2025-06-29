import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { PassengerType } from '@prisma/client';

export class PassengerDataDto {
  @ApiProperty({
    description: 'ID del asiento seleccionado',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  seatId: number;

  @ApiProperty({
    description: 'Tipo de pasajero',
    example: 'NORMAL',
    enum: PassengerType,
  })
  @IsEnum(PassengerType)
  @IsNotEmpty()
  passengerType: PassengerType;

  @ApiProperty({
    description: 'Nombres del pasajero',
    example: 'Juan Carlos',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Apellidos del pasajero',
    example: 'Pérez García',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'Número de cédula o pasaporte',
    example: '1234567890',
  })
  @IsString()
  @IsNotEmpty()
  idNumber: string;
}

export class InitiatePurchaseDto {
  @ApiProperty({
    description: 'ID del detalle de hoja de ruta',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  routeSheetDetailId: number;

  @ApiProperty({
    description: 'Lista de pasajeros y asientos',
    type: [PassengerDataDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PassengerDataDto)
  passengers: PassengerDataDto[];

  @ApiProperty({
    description: 'Método de pago',
    example: 'stripe',
    enum: ['stripe', 'cash'],
  })
  @IsEnum(['stripe', 'cash'])
  @IsNotEmpty()
  paymentMethod: 'stripe' | 'cash';
}