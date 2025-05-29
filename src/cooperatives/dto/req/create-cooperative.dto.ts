// src/cooperatives/dto/req/create-cooperative.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class CreateCooperativeDto {
  @ApiProperty({ example: 'Cooperativa San Miguel' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Av. Siempre Viva 123' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: '0991234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'sanmiguel@coop.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'logo.png' })
  @IsString()
  @IsNotEmpty()
  logo: string;
}
