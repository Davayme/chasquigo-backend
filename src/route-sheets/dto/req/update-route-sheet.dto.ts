import { PartialType } from '@nestjs/swagger';
import { CreateRouteSheetDto } from './create-route-sheet.dto';

export class UpdateRouteSheetDto extends PartialType(CreateRouteSheetDto) {}
