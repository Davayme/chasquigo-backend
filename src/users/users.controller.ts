// filepath: c:\Users\davay\Documents\Projects\Nestjs Projects\chasquigo-backend\src\users\users.controller.ts
import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserAdminService } from './user_admin/user-admin.service';
import { CreateUserDto } from './dtos/req/create-user.dto';
import {
  ApiOperation,
  ApiTags,
  ApiResponse
} from '@nestjs/swagger';
import { UserDriverService } from './user_admin/user-driver.service';
import { UserClientService } from './user_admin/user-client.service';

@ApiTags('usuarios')
@Controller('users')
export class UsersController {
  constructor(private readonly userAdminService: UserAdminService,
    private readonly userDriverService: UserDriverService,
    private readonly userClientService: UserClientService
  ) { }

  @Post('admin')
  @ApiOperation({ summary: 'Crear usuario administrador' })
  @ApiResponse({ status: 201, description: 'Creado correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Email o ID ya registrado' })
  async createAdminUser(@Body() createAdminUserDto: CreateUserDto) {
    return this.userAdminService.createAdminUser(createAdminUserDto);
  }

  @Post('driver')
  @ApiOperation({ summary: 'Crear usuario chofer' })
  @ApiResponse({ status: 201, description: 'Creado correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Email o ID ya registrado' })
  async createDriverUser(@Body() createAdminUserDto: CreateUserDto) {
    return this.userDriverService.createDriverUser(createAdminUserDto);
  }

  @Post('client')
  @ApiOperation({ summary: 'Crear usuario cliente' })
  @ApiResponse({ status: 201, description: 'Creado correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Email o ID ya registrado' })
  async createClientUser(@Body() createAdminUserDto: CreateUserDto) {
    return this.userClientService.createClientUser(createAdminUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener usuarios' })
  @ApiResponse({ status: 200, description: 'Lista de administradores' })
  async getAllAdminUsers() {
    return this.userAdminService.getAllUsers();
  }
}