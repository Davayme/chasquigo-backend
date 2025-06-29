import { PartialType } from '@nestjs/swagger';
import { CreateTypeBusDto } from './create-type-bus.dto';

export class UpdateTypeBusDto extends PartialType(CreateTypeBusDto) {}
