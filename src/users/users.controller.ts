import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserAdminService } from './user_admin/user_admin.service';
import { CreateAdminUserDto } from './dtos/req/create-user.dto';
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags,
  ApiBody,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiOkResponse,
  ApiInternalServerErrorResponse,
  ApiProperty
} from '@nestjs/swagger';


class AdminUserResponse {
  @ApiProperty({ example: 1 })
  id: number;
  
  @ApiProperty({ example: '1234567890' })
  idNumber: string;
  
  @ApiProperty({ example: 'Juan Pablo' })
  firstName: string;
  
  @ApiProperty({ example: 'García López' })
  lastName: string;
  
  @ApiProperty({ example: 'admin@cooperativa.com' })
  email: string;
  
  @ApiProperty({ example: '+593987654321' })
  phone: string;
  
  @ApiProperty({
    example: { id: 1, name: 'admin_coop' }
  })
  role: {
    id: number;
    name: string;
  };
  
  @ApiProperty({ example: null, nullable: true })
  cooperativeId: number | null;
}

@ApiTags('usuarios')
@Controller('users')
export class UsersController {
  constructor(private readonly userAdminService: UserAdminService) {}

  @Post('admin')
  @ApiOperation({ 
    summary: 'Crear un nuevo usuario administrador de cooperativa',
    description: 'Crea un usuario con rol de administrador de cooperativa. Este usuario podrá crear y administrar una cooperativa posteriormente.'
  })
  @ApiBody({
    type: CreateAdminUserDto,
    description: 'Datos del usuario administrador a crear'
  })
  @ApiCreatedResponse({
    description: 'Usuario administrador creado exitosamente',
    type: AdminUserResponse
  })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos. Revise el formato de los datos enviados.'
  })
  @ApiConflictResponse({
    description: 'Conflicto: El correo electrónico o número de identificación ya está registrado'
  })
  async createAdminUser(@Body() createAdminUserDto: CreateAdminUserDto) {
    return this.userAdminService.createAdminUser(createAdminUserDto);
  }

  @Get('admin')
  @ApiOperation({ 
    summary: 'Obtener todos los usuarios administradores de cooperativas',
    description: 'Retorna un listado de todos los usuarios con rol de administrador de cooperativa'
  })
  @ApiOkResponse({
    description: 'Lista de usuarios administradores recuperada exitosamente',
    type: [AdminUserResponse]
  })
  @ApiInternalServerErrorResponse({
    description: 'Error del servidor al recuperar los datos'
  })
  async getAllAdminUsers() {
    return this.userAdminService.getAllAdminUsers();
  }
}