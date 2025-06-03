import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserAdminService } from './user-admin/user-admin.service';
import { CreateUserDto } from './dtos/req/create-user.dto';
import {
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiBearerAuth
} from '@nestjs/swagger';
import { UserDriverService } from './user-driver/user-driver.service';
import { UserClientService } from './user-client/user-client.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('usuarios')
@Controller('users')
export class UsersController {
  constructor(private readonly userAdminService: UserAdminService,
    private readonly userDriverService: UserDriverService,
    private readonly userClientService: UserClientService
  ) { }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
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
  @UseGuards(JwtAuthGuard) 
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Obtener usuarios' })
  @ApiResponse({ status: 200, description: 'Lista de todos los usuarios' })
  async getAllAdminUsers() {
    return this.userAdminService.getAllUsers();
  }
}