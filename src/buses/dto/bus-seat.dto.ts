import { IsString, IsIn, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
    enum: ['normal', 'VIP', 'discapacitado']
  })
  @IsString()
  @IsIn(['normal', 'VIP', 'discapacitado'])
  type: string;

  @ApiProperty({
    description: 'Ubicación del asiento',
    example: 'ventana',
    enum: ['pasillo', 'ventana']
  })
  @IsString()
  @IsIn(['pasillo', 'ventana'])
  location: string;
}