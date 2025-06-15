import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FrequenciesService } from './frequencies.service';
import { CreateFrequencyDto } from './dto/req/create-frequency.dto';
import { UpdateFrequencyDto } from './dto/req/update-frequency.dto';

@Controller('frequencies')
export class FrequenciesController {
  constructor(private readonly frequenciesService: FrequenciesService) {}

  @Post()
  create(@Body() createFrequencyDto: CreateFrequencyDto) {
    return this.frequenciesService.create(createFrequencyDto);
  }

  @Get()
  findAll() {
    return this.frequenciesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.frequenciesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFrequencyDto: UpdateFrequencyDto) {
    return this.frequenciesService.update(+id, updateFrequencyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.frequenciesService.remove(+id);
  }
}
