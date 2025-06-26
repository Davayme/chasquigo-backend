import { ApiProperty } from "@nestjs/swagger";
import { Province } from "@prisma/client";

export class CityResDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    name: string;

    @ApiProperty()
    province: Province;
}
