import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsEmail, IsInt, Min } from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiProperty({
    description: 'Monto a cobrar (en dólares)',
    example: 25.99,
    minimum: 0.5
  })
  @IsNumber()
  @Min(0.5)
  amount: number;

  @ApiProperty({
    description: 'Correo electrónico del usuario (opcional)',
    example: 'usuario@ejemplo.com',
    required: false
  })
  @IsEmail()
  @IsOptional()
  userEmail?: string;

  @ApiProperty({
    description: 'ID del usuario en el sistema (opcional)',
    example: 1,
    required: false
  })
  @IsInt()
  @IsOptional()
  userId?: number;
} 