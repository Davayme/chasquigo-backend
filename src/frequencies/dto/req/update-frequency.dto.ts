import { PartialType } from '@nestjs/swagger';
import { CreateFrequencyDto } from './create-frequency.dto';

export class UpdateFrequencyDto extends PartialType(CreateFrequencyDto) {}
