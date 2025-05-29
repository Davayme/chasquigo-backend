// dto/res/cooperative-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class CooperativeResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  logo: string;

  @ApiProperty()
  createdAt: Date;
}
