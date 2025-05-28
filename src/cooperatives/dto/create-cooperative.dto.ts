import { IsString, IsEmail } from 'class-validator';

export class CreateCooperativeDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsString()
  phone: string;

  @IsEmail()
  email: string;

  @IsString()
  logo: string;
}
