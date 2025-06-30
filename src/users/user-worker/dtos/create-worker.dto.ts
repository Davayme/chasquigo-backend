import { IsString, IsEmail, IsPhoneNumber, IsOptional, IsInt, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';

export class CreateWorkerDto {
  @ApiProperty({
    description: 'Número de cédula o documento de identidad',
    example: '1234567890',
    minLength: 10,
    maxLength: 13
  })
  @IsString()
  idNumber: string;

  @ApiProperty({
    description: 'Tipo de documento',
    enum: DocumentType,
    example: DocumentType.CEDULA
  })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({
    description: 'Nombres del trabajador',
    example: 'Juan Carlos'
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Apellidos del trabajador',
    example: 'Pérez González'
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Correo electrónico del trabajador',
    example: 'juan.perez@chasquigo.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Número de teléfono del trabajador',
    example: '+593987654321'
  })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Contraseña del trabajador (mínimo 6 caracteres)',
    example: 'password123',
    minLength: 6
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'ID de la cooperativa a la que pertenece el trabajador',
    example: 1,
    required: false
  })
  @IsOptional()
  @IsInt()
  cooperativeId?: number;
}
