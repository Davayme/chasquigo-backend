import { ConflictException, Injectable, NotFoundException, Logger, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateUserDto } from "../dtos/req/create-user.dto";
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserClientService {
private readonly logger = new Logger(UserClientService.name);
  constructor(private readonly prisma:PrismaService) {}

    async createClientUser(createAdminUserDto: CreateUserDto) {
      try {
   
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
  
        // ID de rol de cliente predefinido
        const adminRoleId = 3;
  
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
}