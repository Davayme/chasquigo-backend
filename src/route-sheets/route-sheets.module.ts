import { Module } from '@nestjs/common';
import { RouteSheetsService } from './route-sheets.service';
import { RouteSheetsController } from './route-sheets.controller';

@Module({
  controllers: [RouteSheetsController],
  providers: [RouteSheetsService],
})
export class RouteSheetsModule {}
