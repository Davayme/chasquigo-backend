// filepath: c:\Users\davay\Documents\Projects\Nestjs Projects\chasquigo-backend\src\users\users.controller.ts
import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserAdminService } from './user_admin/user_admin.service';
import { CreateAdminUserDto } from './dtos/req/create-user.dto';
import { 
  ApiOperation, 
  ApiTags,
  ApiResponse
} from '@nestjs/swagger';

@ApiTags('usuarios')
@Controller('users')
export class UsersController {
  constructor(private readonly userAdminService: UserAdminService) {}

  @Post('admin')
  @ApiOperation({ summary: 'Crear usuario administrador' })
  @ApiResponse({ status: 201, description: 'Creado correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Email o ID ya registrado' })
  async createAdminUser(@Body() createAdminUserDto: CreateAdminUserDto) {
    return this.userAdminService.createAdminUser(createAdminUserDto);
  }

  @Get('admin')
  @ApiOperation({ summary: 'Obtener administradores' })
  @ApiResponse({ status: 200, description: 'Lista de administradores' })
  async getAllAdminUsers() {
    return this.userAdminService.getAllAdminUsers();
  }
}