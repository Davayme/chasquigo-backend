import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { CooperativesModule } from './cooperatives/cooperatives.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { BusesModule } from './buses/buses.module';
import { StripeModule } from './stripe/stripe.module';
import { FrequenciesModule } from './frequencies/frequencies.module';
import { CitiesModule } from './cities/cities.module';
import { IntermediateStopsModule } from './intermediate-stops/intermediate-stops.module';
import { RouteSheetsModule } from './route-sheets/route-sheets.module';
import { TicketsModule } from './tickets/tickets.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { AwsModule } from './aws/aws.module';
import { DriversModule } from './drivers/drivers.module';


@Module({
  imports: [
    UsersModule, 
    CooperativesModule, 
    CommonModule, 
    AuthModule, 
    BusesModule, 
    StripeModule,
    FrequenciesModule,
    CitiesModule,
    IntermediateStopsModule,
    RouteSheetsModule,
    TicketsModule,
    CloudinaryModule,
    AwsModule,
    DriversModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
