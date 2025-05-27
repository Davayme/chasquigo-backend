import { IsEmail, IsEnum, IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum DocumentType {
  CEDULA = 'cedula',
  PASAPORTE = 'pasaporte'
}

export class CreateAdminUserDto {
  @ApiProperty({
    description: 'Número de identificación (cédula o pasaporte)',
    example: '1234567890',
    minLength: 10,
    maxLength: 13
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 13)
  @Matches(/^[0-9]+$/, { message: 'El número de identificación debe contener solo números' })
  idNumber: string;

  @ApiProperty({
    description: 'Tipo de documento',
    enum: DocumentType,
    example: 'cedula',
    enumName: 'DocumentType'
  })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({
    description: 'Nombres del administrador',
    example: 'Juan Pablo'
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Apellidos del administrador',
    example: 'García López'
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'Correo electrónico',
    example: 'admin@cooperativa.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Número telefónico',
    example: '+593987654321'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{9,15}$/, { message: 'Por favor ingrese un número de teléfono válido' })
  phone: string;

  @ApiProperty({
    description: 'Contraseña (mínimo 8 caracteres, con mayúsculas, minúsculas y números)',
    example: 'Password123'
  })
  @IsString()
  @IsNotEmpty()
  @Length(6)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/, {
    message: 'La contraseña debe tener al menos 6 caracteres, una mayúscula, una minúscula y un número'
  })
  password: string;
}