import { IsEmail, IsEnum, IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { DocumentType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';


export class CreateUserDto {
  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  @Length(10, 13)
  @Matches(/^[0-9]+$/, { message: 'El número de identificación debe contener solo números' })
  idNumber: string;

  @ApiProperty({ example: 'cedula', enum: DocumentType })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'García' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'admin@cooperativa.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+593987654321' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{9,15}$/, { message: 'Por favor ingrese un número de teléfono válido' })
  phone: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @IsNotEmpty()
  @Length(6)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/, {
    message: 'La contraseña debe tener al menos 6 caracteres, una mayúscula, una minúscula y un número'
  })
  password: string;
}