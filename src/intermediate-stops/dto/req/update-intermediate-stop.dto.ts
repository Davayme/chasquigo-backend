import { PartialType } from '@nestjs/swagger';
import { CreateIntermediateStopDto } from './create-intermediate-stop.dto';

export class UpdateIntermediateStopDto extends PartialType(CreateIntermediateStopDto) {}
