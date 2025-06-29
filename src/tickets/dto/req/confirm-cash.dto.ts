import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ConfirmCashPaymentDto {
  @ApiProperty({
    description: 'ID del staff que confirma el pago',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  staffUserId: number;

  @ApiProperty({
    description: 'ID de la transacción de compra',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  purchaseTransactionId: number;

  @ApiProperty({
    description: 'Monto recibido en efectivo',
    example: 75.50,
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    description: 'Notas adicionales (opcional)',
    example: 'Pago recibido en oficina principal',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}