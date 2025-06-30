import { IsString, IsEmail, IsOptional, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';

export class UpdateWorkerDto {
  @ApiProperty({
    description: 'Número de cédula o documento de identidad',
    example: '1234567890',
    required: false
  })
  @IsOptional()
  @IsString()
  idNumber?: string;

  @ApiProperty({
    description: 'Tipo de documento',
    enum: DocumentType,
    example: DocumentType.CEDULA,
    required: false
  })
  @IsOptional()
  documentType?: DocumentType;

  @ApiProperty({
    description: 'Nombres del trabajador',
    example: 'Juan Carlos',
    required: false
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'Apellidos del trabajador',
    example: 'Pérez González',
    required: false
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'Correo electrónico del trabajador',
    example: 'juan.perez@chasquigo.com',
    required: false
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Número de teléfono del trabajador',
    example: '+593987654321',
    required: false
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'ID de la cooperativa a la que pertenece el trabajador',
    example: 1,
    required: false
  })
  @IsOptional()
  @IsInt()
  cooperativeId?: number;
}
