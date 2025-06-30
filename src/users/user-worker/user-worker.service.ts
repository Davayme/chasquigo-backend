import { ConflictException, Injectable, NotFoundException, Logger, InternalServerErrorException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateWorkerDto } from "./dtos/create-worker.dto";
import { UpdateWorkerDto } from "./dtos/update-worker.dto";
import { ChangePasswordDto } from "./dtos/change-password.dto";
import { WorkerResponseDto, WorkersListResponseDto } from "./dtos/worker-response.dto";
import * as bcrypt from 'bcrypt';
import { PrismaErrorHandler } from "src/common/filters/prisma-errors";
import { Role } from "@prisma/client";

@Injectable()
export class UserWorkerService {
  private readonly logger = new Logger(UserWorkerService.name);

  constructor(private readonly prisma: PrismaService) { }

  /**
   * 👷 CREAR NUEVO TRABAJADOR
   */
  async createWorker(createWorkerDto: CreateWorkerDto): Promise<WorkerResponseDto> {
    try {
      this.logger.log(`👷 Creando nuevo trabajador: ${createWorkerDto.firstName} ${createWorkerDto.lastName}`);

      // Verificar si ya existe un usuario con esa cédula
      const existingUser = await this.prisma.user.findFirst({
        where: {
          idNumber: createWorkerDto.idNumber,
          isDeleted: false
        }
      });

      if (existingUser) {
        throw new ConflictException(`Ya existe un usuario con la cédula ${createWorkerDto.idNumber}`);
      }

      // Verificar si ya existe un usuario con ese email
      const existingEmail = await this.prisma.user.findFirst({
        where: {
          email: createWorkerDto.email,
          isDeleted: false
        }
      });

      if (existingEmail) {
        throw new ConflictException(`Ya existe un usuario con el email ${createWorkerDto.email}`);
      }

      // Verificar que la cooperativa existe si se proporciona
      if (createWorkerDto.cooperativeId) {
        const cooperative = await this.prisma.cooperative.findFirst({
          where: {
            id: createWorkerDto.cooperativeId,
            isDeleted: false
          }
        });

        if (!cooperative) {
          throw new NotFoundException(`Cooperativa con ID ${createWorkerDto.cooperativeId} no encontrada`);
        }
      }

      // Encriptar la contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(createWorkerDto.password, saltRounds);

      // Crear el trabajador
      const worker = await this.prisma.user.create({
        data: {
          idNumber: createWorkerDto.idNumber,
          documentType: createWorkerDto.documentType,
          firstName: createWorkerDto.firstName,
          lastName: createWorkerDto.lastName,
          email: createWorkerDto.email,
          phone: createWorkerDto.phone,
          password: hashedPassword,
          role: Role.WORKER,
          cooperativeId: createWorkerDto.cooperativeId
        },
        include: {
          cooperative: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      this.logger.log(`✅ Trabajador creado exitosamente: ID ${worker.id}`);

      return this.formatWorkerResponse(worker);
    } catch (error) {
      this.logger.error(`❌ Error creando trabajador: ${error.message}`, error.stack);
      
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }

      // Manejar errores de Prisma
      PrismaErrorHandler.handleError(error, 'Crear trabajador');

      throw new InternalServerErrorException('Error interno del servidor al crear trabajador');
    }
  }

  /**
   * 📋 OBTENER LISTA DE TRABAJADORES CON PAGINACIÓN
   */
  async getWorkers(
    page: number = 1,
    limit: number = 10,
    search?: string,
    cooperativeId?: number
  ): Promise<WorkersListResponseDto> {
    try {
      this.logger.log(`📋 Obteniendo lista de trabajadores: página ${page}, límite ${limit}`);

      const skip = (page - 1) * limit;

      // Construir filtros
      const where: any = {
        role: Role.WORKER,
        isDeleted: false
      };

      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { idNumber: { contains: search } }
        ];
      }

      if (cooperativeId) {
        where.cooperativeId = cooperativeId;
      }

      // Obtener trabajadores con paginación
      const [workers, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          include: {
            cooperative: {
              select: {
                id: true,
                name: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: [
            { firstName: 'asc' },
            { lastName: 'asc' }
          ]
        }),
        this.prisma.user.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      this.logger.log(`✅ ${workers.length} trabajadores obtenidos de ${total} total`);

      return {
        workers: workers.map(worker => this.formatWorkerResponse(worker)),
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      this.logger.error(`❌ Error obteniendo trabajadores: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error interno del servidor al obtener trabajadores');
    }
  }

  /**
   * 🔍 OBTENER TRABAJADOR POR ID
   */
  async getWorkerById(id: number): Promise<WorkerResponseDto> {
    try {
      this.logger.log(`🔍 Obteniendo trabajador por ID: ${id}`);

      const worker = await this.prisma.user.findFirst({
        where: {
          id,
          role: Role.WORKER,
          isDeleted: false
        },
        include: {
          cooperative: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!worker) {
        throw new NotFoundException(`Trabajador con ID ${id} no encontrado`);
      }

      this.logger.log(`✅ Trabajador encontrado: ${worker.firstName} ${worker.lastName}`);

      return this.formatWorkerResponse(worker);
    } catch (error) {
      this.logger.error(`❌ Error obteniendo trabajador ${id}: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Error interno del servidor al obtener trabajador');
    }
  }

  /**
   * ✏️ ACTUALIZAR TRABAJADOR
   */
  async updateWorker(id: number, updateWorkerDto: UpdateWorkerDto): Promise<WorkerResponseDto> {
    try {
      this.logger.log(`✏️ Actualizando trabajador ID: ${id}`);

      // Verificar que el trabajador existe
      const existingWorker = await this.prisma.user.findFirst({
        where: {
          id,
          role: Role.WORKER,
          isDeleted: false
        }
      });

      if (!existingWorker) {
        throw new NotFoundException(`Trabajador con ID ${id} no encontrado`);
      }

      // Verificar unicidad de cédula si se va a cambiar
      if (updateWorkerDto.idNumber && updateWorkerDto.idNumber !== existingWorker.idNumber) {
        const existingIdNumber = await this.prisma.user.findFirst({
          where: {
            idNumber: updateWorkerDto.idNumber,
            isDeleted: false,
            id: { not: id }
          }
        });

        if (existingIdNumber) {
          throw new ConflictException(`Ya existe un usuario con la cédula ${updateWorkerDto.idNumber}`);
        }
      }

      // Verificar unicidad de email si se va a cambiar
      if (updateWorkerDto.email && updateWorkerDto.email !== existingWorker.email) {
        const existingEmail = await this.prisma.user.findFirst({
          where: {
            email: updateWorkerDto.email,
            isDeleted: false,
            id: { not: id }
          }
        });

        if (existingEmail) {
          throw new ConflictException(`Ya existe un usuario con el email ${updateWorkerDto.email}`);
        }
      }

      // Verificar que la cooperativa existe si se proporciona
      if (updateWorkerDto.cooperativeId) {
        const cooperative = await this.prisma.cooperative.findFirst({
          where: {
            id: updateWorkerDto.cooperativeId,
            isDeleted: false
          }
        });

        if (!cooperative) {
          throw new NotFoundException(`Cooperativa con ID ${updateWorkerDto.cooperativeId} no encontrada`);
        }
      }

      // Actualizar el trabajador
      const updatedWorker = await this.prisma.user.update({
        where: { id },
        data: updateWorkerDto,
        include: {
          cooperative: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      this.logger.log(`✅ Trabajador actualizado exitosamente: ${updatedWorker.firstName} ${updatedWorker.lastName}`);

      return this.formatWorkerResponse(updatedWorker);
    } catch (error) {
      this.logger.error(`❌ Error actualizando trabajador ${id}: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }

      PrismaErrorHandler.handleError(error, 'Actualizar trabajador');

      throw new InternalServerErrorException('Error interno del servidor al actualizar trabajador');
    }
  }

  /**
   * 🔑 CAMBIAR CONTRASEÑA DE TRABAJADOR
   */
  async changeWorkerPassword(id: number, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    try {
      this.logger.log(`🔑 Cambiando contraseña del trabajador ID: ${id}`);

      // Verificar que el trabajador existe
      const worker = await this.prisma.user.findFirst({
        where: {
          id,
          role: Role.WORKER,
          isDeleted: false
        }
      });

      if (!worker) {
        throw new NotFoundException(`Trabajador con ID ${id} no encontrado`);
      }

      // Encriptar la nueva contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, saltRounds);

      // Actualizar la contraseña
      await this.prisma.user.update({
        where: { id },
        data: { password: hashedPassword }
      });

      this.logger.log(`✅ Contraseña cambiada exitosamente para trabajador: ${worker.firstName} ${worker.lastName}`);

      return { message: 'Contraseña cambiada exitosamente' };
    } catch (error) {
      this.logger.error(`❌ Error cambiando contraseña del trabajador ${id}: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Error interno del servidor al cambiar contraseña');
    }
  }

  /**
   * 🗑️ ELIMINAR TRABAJADOR (LÓGICO)
   */
  async deleteWorker(id: number): Promise<{ message: string }> {
    try {
      this.logger.log(`🗑️ Eliminando trabajador ID: ${id}`);

      // Verificar que el trabajador existe
      const worker = await this.prisma.user.findFirst({
        where: {
          id,
          role: Role.WORKER,
          isDeleted: false
        }
      });

      if (!worker) {
        throw new NotFoundException(`Trabajador con ID ${id} no encontrado`);
      }

      // Eliminar lógicamente
      await this.prisma.user.update({
        where: { id },
        data: { isDeleted: true }
      });

      this.logger.log(`✅ Trabajador eliminado exitosamente: ${worker.firstName} ${worker.lastName}`);

      return { message: `Trabajador ${worker.firstName} ${worker.lastName} eliminado exitosamente` };
    } catch (error) {
      this.logger.error(`❌ Error eliminando trabajador ${id}: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Error interno del servidor al eliminar trabajador');
    }
  }

  /**
   * 🔄 RESTAURAR TRABAJADOR ELIMINADO
   */
  async restoreWorker(id: number): Promise<WorkerResponseDto> {
    try {
      this.logger.log(`🔄 Restaurando trabajador ID: ${id}`);

      // Verificar que el trabajador existe y está eliminado
      const worker = await this.prisma.user.findFirst({
        where: {
          id,
          role: Role.WORKER,
          isDeleted: true
        }
      });

      if (!worker) {
        throw new NotFoundException(`Trabajador eliminado con ID ${id} no encontrado`);
      }

      // Verificar que no exista otro usuario activo con la misma cédula
      const existingIdNumber = await this.prisma.user.findFirst({
        where: {
          idNumber: worker.idNumber,
          isDeleted: false,
          id: { not: id }
        }
      });

      if (existingIdNumber) {
        throw new ConflictException(`Ya existe un usuario activo con la cédula ${worker.idNumber}`);
      }

      // Verificar que no exista otro usuario activo con el mismo email
      const existingEmail = await this.prisma.user.findFirst({
        where: {
          email: worker.email,
          isDeleted: false,
          id: { not: id }
        }
      });

      if (existingEmail) {
        throw new ConflictException(`Ya existe un usuario activo con el email ${worker.email}`);
      }

      // Restaurar el trabajador
      const restoredWorker = await this.prisma.user.update({
        where: { id },
        data: { isDeleted: false },
        include: {
          cooperative: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      this.logger.log(`✅ Trabajador restaurado exitosamente: ${restoredWorker.firstName} ${restoredWorker.lastName}`);

      return this.formatWorkerResponse(restoredWorker);
    } catch (error) {
      this.logger.error(`❌ Error restaurando trabajador ${id}: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }

      throw new InternalServerErrorException('Error interno del servidor al restaurar trabajador');
    }
  }

  /**
   * 🔧 FORMATEAR RESPUESTA DE TRABAJADOR
   */
  private formatWorkerResponse(worker: any): WorkerResponseDto {
    return {
      id: worker.id,
      idNumber: worker.idNumber,
      documentType: worker.documentType,
      firstName: worker.firstName,
      lastName: worker.lastName,
      email: worker.email,
      phone: worker.phone,
      role: worker.role,
      cooperative: worker.cooperative ? {
        id: worker.cooperative.id,
        name: worker.cooperative.name
      } : undefined,
      createdAt: worker.createdAt?.toISOString() || new Date().toISOString()
    };
  }
}