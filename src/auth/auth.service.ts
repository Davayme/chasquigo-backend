import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/req/login.dto';
import * as bcrypt from 'bcrypt';
import { PrismaErrorHandler } from 'src/common/filters/prisma-errors';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    try {
      // Buscar usuario por email con select más eficiente
      const user = await this.prisma.user.findFirst({
        where: {
          email,
          isDeleted: false,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          password: true,
          role: true,
        }
      });

      // Si el usuario existe y la contraseña es correcta
      if (user && await bcrypt.compare(pass, user.password)) {
        const { password, ...result } = user;
        return result;
      }

      return null;
    } catch (error) {
      // Usar el manejador centralizado de errores de Prisma
      PrismaErrorHandler.handleError(error, 'validateUser');
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.validateUser(loginDto.email, loginDto.password);

      if (!user) {
        throw new UnauthorizedException('Credenciales incorrectas');
      }

      // Crear payload para el token JWT
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      // Generar token JWT
      const token = this.jwtService.sign(payload);

      // Retornar respuesta
      return {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      PrismaErrorHandler.handleError(error, 'login');
    }
  }

  async getUserFromToken(user: any) {
    try {
      if (!user || !user.userId) {
        throw new UnauthorizedException('Token inválido o mal formado');
      }

      const userDetails = await this.prisma.user.findUnique({
        where: {
          id: user.userId
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          cooperative: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!userDetails) {
        throw new UnauthorizedException('Usuario no encontrado o desactivado');
      }

      return {
        user: {
          id: userDetails.id,
          email: userDetails.email,
          firstName: userDetails.firstName,
          lastName: userDetails.lastName,
          role: userDetails.role,
          cooperative: userDetails.cooperative
        }
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      PrismaErrorHandler.handleError(error, 'getUserFromToken');
    }
  }

}