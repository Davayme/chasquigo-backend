import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CooperativesModule } from './cooperatives/cooperatives.module';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [UsersModule, CooperativesModule, CommonModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
