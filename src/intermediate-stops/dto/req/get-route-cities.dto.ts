import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class GetRouteCitiesDto {
    @ApiProperty({
        description: 'Ciudad de origen',
        example: 'quito',
    })
    @IsString()
    @IsNotEmpty()
    origen: string;
    @ApiProperty({
        description: 'Ciudad de destino',
        example: 'ambato',
    })
    @IsString()
    @IsNotEmpty()
    destino: string;
}
