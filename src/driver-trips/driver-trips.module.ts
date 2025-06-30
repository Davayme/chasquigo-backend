import { Module } from '@nestjs/common';
import { DriverTripsController } from './driver-trips.controller';
import { DriverTripsService } from './driver-trips.service';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [CommonModule],
    controllers: [DriverTripsController],
    providers: [DriverTripsService],
    exports: [DriverTripsService],
})
export class DriverTripsModule { } 