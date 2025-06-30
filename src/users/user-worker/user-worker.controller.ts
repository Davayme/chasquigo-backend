import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Logger
} from "@nestjs/common";
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery,
  ApiBody 
} from "@nestjs/swagger";
import { UserWorkerService } from "./user-worker.service";
import { CreateWorkerDto } from "./dtos/create-worker.dto";
import { UpdateWorkerDto } from "./dtos/update-worker.dto";
import { ChangePasswordDto } from "./dtos/change-password.dto";
import { WorkerResponseDto, WorkersListResponseDto } from "./dtos/worker-response.dto";

@ApiTags('👷 Gestión de Trabajadores')
@Controller('user-worker')
export class UserWorkerController {
  private readonly logger = new Logger(UserWorkerController.name);

  constructor(private readonly userWorkerService: UserWorkerService) {}

  /**
   * 📝 CREAR NUEVO TRABAJADOR
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Crear nuevo trabajador',
    description: 'Crea un nuevo usuario con rol WORKER en el sistema' 
  })
  @ApiBody({ type: CreateWorkerDto })
  @ApiResponse({
    status: 201,
    description: 'Trabajador creado exitosamente',
    type: WorkerResponseDto
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto - Ya existe un usuario con esa cédula o email'
  })
  @ApiResponse({
    status: 404,
    description: 'Cooperativa no encontrada'
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos'
  })
  async createWorker(@Body() createWorkerDto: CreateWorkerDto): Promise<WorkerResponseDto> {
    this.logger.log(`📝 POST /user-worker - Crear trabajador: ${createWorkerDto.firstName} ${createWorkerDto.lastName}`);
    return this.userWorkerService.createWorker(createWorkerDto);
  }

  /**
   * 📋 OBTENER LISTA DE TRABAJADORES
   */
  @Get()
  @ApiOperation({ 
    summary: 'Obtener lista de trabajadores',
    description: 'Obtiene una lista paginada de trabajadores con filtros opcionales' 
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number, 
    description: 'Número de página (default: 1)',
    example: 1 
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number, 
    description: 'Cantidad de elementos por página (default: 10, max: 100)',
    example: 10 
  })
  @ApiQuery({ 
    name: 'search', 
    required: false, 
    type: String, 
    description: 'Buscar por nombre, apellido, email o cédula',
    example: 'Juan' 
  })
  @ApiQuery({ 
    name: 'cooperativeId', 
    required: false, 
    type: Number, 
    description: 'Filtrar por ID de cooperativa',
    example: 1 
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de trabajadores obtenida exitosamente',
    type: WorkersListResponseDto
  })
  async getWorkers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('cooperativeId') cooperativeId?: string
  ): Promise<WorkersListResponseDto> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? Math.min(parseInt(limit, 10), 100) : 10;
    const cooperativeIdNum = cooperativeId ? parseInt(cooperativeId, 10) : undefined;
    
    this.logger.log(`📋 GET /user-worker - Obtener trabajadores: página ${pageNum}, límite ${limitNum}`);
    
    return this.userWorkerService.getWorkers(pageNum, limitNum, search, cooperativeIdNum);
  }

  /**
   * 🔍 OBTENER TRABAJADOR POR ID
   */
  @Get(':id')
  @ApiOperation({ 
    summary: 'Obtener trabajador por ID',
    description: 'Obtiene la información detallada de un trabajador específico' 
  })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'ID único del trabajador',
    example: 1 
  })
  @ApiResponse({
    status: 200,
    description: 'Trabajador encontrado',
    type: WorkerResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Trabajador no encontrado'
  })
  async getWorkerById(@Param('id', ParseIntPipe) id: number): Promise<WorkerResponseDto> {
    this.logger.log(`🔍 GET /user-worker/${id} - Obtener trabajador por ID`);
    return this.userWorkerService.getWorkerById(id);
  }

  /**
   * ✏️ ACTUALIZAR TRABAJADOR
   */
  @Put(':id')
  @ApiOperation({ 
    summary: 'Actualizar trabajador',
    description: 'Actualiza la información de un trabajador (edición parcial, no requiere todos los campos)' 
  })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'ID único del trabajador',
    example: 1 
  })
  @ApiBody({ type: UpdateWorkerDto })
  @ApiResponse({
    status: 200,
    description: 'Trabajador actualizado exitosamente',
    type: WorkerResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Trabajador no encontrado'
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto - Ya existe un usuario con esa cédula o email'
  })
  async updateWorker(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWorkerDto: UpdateWorkerDto
  ): Promise<WorkerResponseDto> {
    this.logger.log(`✏️ PUT /user-worker/${id} - Actualizar trabajador`);
    return this.userWorkerService.updateWorker(id, updateWorkerDto);
  }

  /**
   * 🔑 CAMBIAR CONTRASEÑA DE TRABAJADOR
   */
  @Put(':id/change-password')
  @ApiOperation({ 
    summary: 'Cambiar contraseña de trabajador',
    description: 'Actualiza la contraseña de un trabajador específico' 
  })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'ID único del trabajador',
    example: 1 
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Contraseña cambiada exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Contraseña cambiada exitosamente'
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Trabajador no encontrado'
  })
  async changeWorkerPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() changePasswordDto: ChangePasswordDto
  ): Promise<{ message: string }> {
    this.logger.log(`🔑 PUT /user-worker/${id}/change-password - Cambiar contraseña`);
    return this.userWorkerService.changeWorkerPassword(id, changePasswordDto);
  }

  /**
   * 🗑️ ELIMINAR TRABAJADOR (LÓGICO)
   */
  @Delete(':id')
  @ApiOperation({ 
    summary: 'Eliminar trabajador',
    description: 'Realiza una eliminación lógica del trabajador (no se elimina físicamente)' 
  })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'ID único del trabajador',
    example: 1 
  })
  @ApiResponse({
    status: 200,
    description: 'Trabajador eliminado exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Trabajador Juan Pérez eliminado exitosamente'
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Trabajador no encontrado'
  })
  async deleteWorker(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    this.logger.log(`🗑️ DELETE /user-worker/${id} - Eliminar trabajador`);
    return this.userWorkerService.deleteWorker(id);
  }

  /**
   * 🔄 RESTAURAR TRABAJADOR ELIMINADO
   */
  @Put(':id/restore')
  @ApiOperation({ 
    summary: 'Restaurar trabajador eliminado',
    description: 'Restaura un trabajador que fue eliminado lógicamente' 
  })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'ID único del trabajador eliminado',
    example: 1 
  })
  @ApiResponse({
    status: 200,
    description: 'Trabajador restaurado exitosamente',
    type: WorkerResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Trabajador eliminado no encontrado'
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto - Ya existe otro usuario activo con la misma cédula o email'
  })
  async restoreWorker(@Param('id', ParseIntPipe) id: number): Promise<WorkerResponseDto> {
    this.logger.log(`🔄 PUT /user-worker/${id}/restore - Restaurar trabajador`);
    return this.userWorkerService.restoreWorker(id);
  }
}
