import { Injectable } from '@nestjs/common';
import { CreateRouteSheetDto } from './dto/req/create-route-sheet.dto';
import { UpdateRouteSheetDto } from './dto/req/update-route-sheet.dto';

@Injectable()
export class RouteSheetsService {
  create(createRouteSheetDto: CreateRouteSheetDto) {
    return 'This action adds a new routeSheet';
  }

  findAll() {
    return `This action returns all routeSheets`;
  }

  findOne(id: number) {
    return `This action returns a #${id} routeSheet`;
  }

  update(id: number, updateRouteSheetDto: UpdateRouteSheetDto) {
    return `This action updates a #${id} routeSheet`;
  }

  remove(id: number) {
    return `This action removes a #${id} routeSheet`;
  }
}
