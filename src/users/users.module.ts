import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserAdminService } from './user-admin/user-admin.service';
import { UserDriverService } from './user-driver/user-driver.service';
import { UserClientService } from './user-client/user-client.service';
import { UserWorkerController } from './user-worker/user-worker.controller';
import { UserWorkerService } from './user-worker/user-worker.service';

@Module({
  controllers: [UsersController, UserWorkerController],
  providers: [UserAdminService, UserDriverService, UserClientService, UserWorkerService],
  exports: [UserAdminService, UserDriverService, UserClientService, UserWorkerService],
  imports: [],
 
})
export class UsersModule {}
