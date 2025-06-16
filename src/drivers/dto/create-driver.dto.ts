import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { DocumentType } from '@prisma/client';

export class CreateDriverDto {
  @ApiProperty({
    description: 'Número de identificación del conductor',
    example: '1804232309'
  })
  @IsNotEmpty()
  @IsString()
  idNumber: string;

  @ApiProperty({
    description: 'Tipo de documento de identificación',
    enum: DocumentType,
    example: DocumentType.CEDULA
  })
  @IsNotEmpty()
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({
    description: 'Nombres del conductor',
    example: 'Juan Carlos'
  })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Apellidos del conductor',
    example: 'Pérez González'
  })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Correo electrónico del conductor',
    example: 'juan.perez@example.com'
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Número de teléfono del conductor',
    example: '0987654321'
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Contraseña del conductor',
    example: 'Password123!'
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'ID de la cooperativa a la que pertenece el conductor',
    example: 1
  })
  @IsNotEmpty()
  cooperativeId: number;
}