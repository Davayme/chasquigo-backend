import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserAdminService } from './user_admin/user_admin.service';
import { CommonModule } from 'src/common/common.module';

@Module({
  controllers: [UsersController],
  providers: [UserAdminService],
  exports: [UserAdminService],
  imports: [CommonModule],
 
})
export class UsersModule {}
