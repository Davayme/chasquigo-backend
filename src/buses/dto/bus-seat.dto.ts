import { IsString, IsIn, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SeatType } from '@prisma/client';

export class BusSeatDto {
  @ApiProperty({
    description: 'Número o identificador del asiento',
    example: '1A'
  })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiProperty({
    description: 'Tipo de asiento',
    example: 'normal',
    enum: SeatType
  })
  @IsString()
  @IsEnum(SeatType)
  type: SeatType;

  @ApiProperty({
    description: 'Ubicación del asiento',
    example: 'ventana',
    enum: ['pasillo', 'ventana']
  })
  @IsString()
  @IsIn(['pasillo', 'ventana'])
  location: string;
}