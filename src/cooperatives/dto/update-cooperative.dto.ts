import { PartialType } from '@nestjs/mapped-types';
import { CreateCooperativeDto } from './req/create-cooperative.dto';

export class UpdateCooperativeDto extends PartialType(CreateCooperativeDto) {}
