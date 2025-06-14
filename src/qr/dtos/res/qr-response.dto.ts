import { ApiProperty } from '@nestjs/swagger';

export class QrCodeResponseDto {
  @ApiProperty({
    description: 'Código QR en formato base64',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA...'
  })
  qrCode: string;
}

export class TicketValidationResponseDto {
  @ApiProperty({
    description: 'Indica si el boleto es válido',
    example: true
  })
  isValid: boolean;

  @ApiProperty({
    description: 'ID del boleto',
    example: 123
  })
  ticketId: number;

  @ApiProperty({
    description: 'Nombre del pasajero',
    example: 'Juan Pérez'
  })
  passengerName: string;

  @ApiProperty({
    description: 'Estado de la validación',
    example: 'valid',
    enum: ['valid', 'invalid']
  })
  status: string;

  @ApiProperty({
    description: 'Mensaje informativo',
    example: 'Boleto válido. Puede abordar.'
  })
  message: string;
}