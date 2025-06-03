import { PartialType } from '@nestjs/swagger';
import { CreateBusDto } from './create-bus.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BusSeatDto } from './bus-seat.dto';

export class UpdateBusDto extends PartialType(CreateBusDto) {
  @ApiProperty({
    description: 'Lista de asientos para actualizar o crear',
    type: [BusSeatDto],
    required: false
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BusSeatDto)
  seats?: BusSeatDto[];
}
