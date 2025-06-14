import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserAdminService } from './user-admin/user-admin.service';
import { CommonModule } from 'src/common/common.module';
import { UserDriverService } from './user-driver/user-driver.service';
import { UserClientService } from './user-client/user-client.service';

@Module({
  controllers: [UsersController],
  providers: [UserAdminService, UserDriverService, UserClientService],
  exports: [UserAdminService, UserDriverService, UserClientService],
  imports: [CommonModule],
 
})
export class UsersModule {}
