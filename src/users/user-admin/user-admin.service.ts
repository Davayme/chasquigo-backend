import { Injectable, ConflictException, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from '../dtos/req/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserAdminService {
  private readonly logger = new Logger(UserAdminService.name);

  constructor(private prisma: PrismaService) { }

  async createAdminUser(createAdminUserDto: CreateUserDto) {
    try {
      // Verificar si el email ya está en uso
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: createAdminUserDto.email,
          isDeleted: false
        }
      });

      if (existingUser) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }

      // Verificar si la cédula/identificación ya está en uso
      const existingIdNumber = await this.prisma.user.findFirst({
        where: {
          idNumber: createAdminUserDto.idNumber,
          isDeleted: false
        }
      });

      if (existingIdNumber) {
        throw new ConflictException('El número de identificación ya está registrado');
      }

      // ID de rol de admin_coop predefinido
      const adminRoleId = 1;

      // Encriptar la contraseña
      const hashedPassword = await bcrypt.hash(createAdminUserDto.password, 10);

      // Crear el usuario
      const newUser = await this.prisma.user.create({
        data: {
          idNumber: createAdminUserDto.idNumber,
          documentType: createAdminUserDto.documentType,
          firstName: createAdminUserDto.firstName,
          lastName: createAdminUserDto.lastName,
          email: createAdminUserDto.email,
          phone: createAdminUserDto.phone,
          password: hashedPassword,
          roleId: adminRoleId,
          isDeleted: false
        },
        select: {
          id: true,
          idNumber: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: {
            select: {
              id: true,
              name: true
            }
          },
          cooperativeId: true
        }
      });

      return newUser;
    } catch (error) {

      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }

      // Para errores de Prisma o inesperados, los transformamos en mensajes más amigables
      this.logger.error(`Error al crear usuario administrador: ${error.message}`, error.stack);

      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe un registro con estos datos');
      }

      throw new InternalServerErrorException('Error al crear el usuario administrador');
    }
  }

  async getAllUsers() {
    try {

      // Obtener todos los usuarios con rol admin_coop
      return await this.prisma.user.findMany({
        where: {
          isDeleted: false
        },
        select: {
          id: true,
          idNumber: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: {
            select: {
              id: true,
              name: true
            }
          },
          cooperative: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    } catch (error) {
      this.logger.error(`Error al obtener usuarios administradores: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al recuperar los usuarios administradores');
    }
  }


  async getCooperativeInfoByUserId(userId: number) {
    try {
      // Obtener la cooperativa asociada al usuario
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          cooperative: {
            select: {
              id: true,
              name: true,
              address: true,
              logo: true,
              phone: true,
              email: true
            }
          }
        }
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      if (!user.cooperative) {
        throw new NotFoundException('Cooperativa no asociada al usuario');
      }

      return user.cooperative;
    } catch (error) {
      // Si es una NotFoundException, reenviarla sin modificar
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al obtener información de la cooperativa del usuario ${userId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al recuperar la información de la cooperativa del usuario');
    }
  }
}