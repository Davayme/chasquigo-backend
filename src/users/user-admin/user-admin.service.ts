import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from '../dtos/req/create-user.dto';
import * as bcrypt from 'bcrypt';
import { PrismaErrorHandler } from 'src/common/filters/prisma-errors';
import { Role } from '@prisma/client';

@Injectable()
export class UserAdminService {
  private readonly logger = new Logger(UserAdminService.name);

  constructor(private prisma: PrismaService) {}

  async createAdminUser(createAdminUserDto: CreateUserDto) {
    try {
      // Verificar si el email ya está en uso
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: createAdminUserDto.email,
          isDeleted: false,
        },
      });

      if (existingUser) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }

      // Verificar si la cédula/identificación ya está en uso
      const existingIdNumber = await this.prisma.user.findFirst({
        where: {
          idNumber: createAdminUserDto.idNumber,
          isDeleted: false,
        },
      });

      if (existingIdNumber) {
        throw new ConflictException(
          'El número de identificación ya está registrado',
        );
      }

      // ID de rol de admin_coop predefinido
      const adminRoleId = Role.ADMIN;

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
          role: adminRoleId,
          isDeleted: false,
        },
        select: {
          id: true,
          idNumber: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          cooperativeId: true,
        },
      });

      return newUser;
    } catch (error) {
      // Si ya es una excepción HTTP conocida, la reenvío sin modificar
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      // Usar el manejador centralizado para errores de Prisma
      PrismaErrorHandler.handleError(error, 'createAdminUser');
    }
  }

  async getAllUsers() {
    try {
      // Obtener todos los usuarios con rol admin_coop
      return await this.prisma.user.findMany({
        where: {
          isDeleted: false,
        },
        select: {
          id: true,
          idNumber: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          cooperative: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      // Usar el manejador centralizado para errores de Prisma
      PrismaErrorHandler.handleError(error, 'getAllUsers');
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
              email: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      if (!user.cooperative) {
        throw new NotFoundException('Cooperativa no asociada al usuario');
      }

      return user.cooperative;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      PrismaErrorHandler.handleError(
        error,
        `getCooperativeInfoByUserId(${userId})`,
      );
    }
  }
}
