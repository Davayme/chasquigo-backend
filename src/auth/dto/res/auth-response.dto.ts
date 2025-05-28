import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty()
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: {
      id: number;
      name: string;
    };
  };
}