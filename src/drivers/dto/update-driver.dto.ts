import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { DocumentType } from '@prisma/client';

export class UpdateDriverDto {
  @ApiProperty({
    description: 'Número de identificación del conductor',
    example: '1234567890',
    required: false
  })
  @IsOptional()
  @IsString()
  idNumber?: string;

  @ApiProperty({
    description: 'Tipo de documento de identificación',
    enum: DocumentType,
    example: DocumentType.CEDULA,
    required: false
  })
  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType;

  @ApiProperty({
    description: 'Nombres del conductor',
    example: 'Juan Carlos',
    required: false
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'Apellidos del conductor',
    example: 'Pérez González',
    required: false
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'Correo electrónico del conductor',
    example: 'juan.perez@example.com',
    required: false
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Número de teléfono del conductor',
    example: '0987654321',
    required: false
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Contraseña del conductor',
    example: 'Password123!',
    required: false
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}