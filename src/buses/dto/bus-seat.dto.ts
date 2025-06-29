import { IsString, IsNotEmpty, IsEnum, IsInt, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SeatLocation, SeatType } from '@prisma/client';

export class BusSeatDto {
  @ApiProperty({
    description: 'Piso del asiento',
    example: 1,
    minimum: 1,
    maximum: 2
  })
  @IsInt()
  @Min(1)
  @Max(2)
  floor: number;

  @ApiProperty({
    description: 'Número o identificador del asiento',
    example: '1A'
  })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiProperty({
    description: 'Tipo de asiento',
    example: 'NORMAL',
    enum: SeatType
  })
  @IsString()
  @IsEnum(SeatType)
  type: SeatType;

  @ApiProperty({
    description: 'Ubicación del asiento',
    example: 'WINDOW',
    enum: SeatLocation
  })
  @IsString()
  @IsEnum(SeatLocation)
  location: SeatLocation;
}