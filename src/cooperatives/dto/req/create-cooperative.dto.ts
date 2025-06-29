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

  @ApiProperty({ example: 'https://www.facebook.com/share/g/1AYRGX7aNr/' })
  @IsString()
  @IsNotEmpty()
  facebook: string;

  @ApiProperty({ example: 'https://www.instagram.com/reel/DKpreMQvH1G/?igsh=enJ5c3VjM2c0b3lp' })
  @IsString()
  @IsNotEmpty()
  instagram: string;

  @ApiProperty({ example: 'https://x.com/shachimu' })
  @IsString()
  @IsNotEmpty()
  x: string;

  @ApiProperty({ example: 'https://chasquigo.com' })
  @IsString()
  @IsNotEmpty()
  website: string;
}
