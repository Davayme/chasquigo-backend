import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Nueva contraseña (mínimo 6 caracteres)',
    example: 'newPassword123',
    minLength: 6
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
