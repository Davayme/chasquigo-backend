import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { CooperativesModule } from './cooperatives/cooperatives.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { BusesModule } from './buses/buses.module';


@Module({
  imports: [UsersModule, CooperativesModule, CommonModule, AuthModule, BusesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
