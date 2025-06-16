import { ApiProperty } from '@nestjs/swagger';
import { Province } from '@prisma/client';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export class CreateCityDto {
  @ApiProperty({
    description: 'Nombre de la ciudad',
    example: 'Lima',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Provincia de la ciudad',
    example: 'Lima',
    enum: Province,
    enumName: 'Province',
  })
  @IsEnum(Province)
  @IsNotEmpty()
  province: Province;
}
