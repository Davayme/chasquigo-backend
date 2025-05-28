import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/req/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    try {
      // Buscar usuario por email
      const user = await this.prisma.user.findFirst({
        where: { 
          email,
          isDeleted: false,
        },
        include: {
          role: true,
        },
      });

      // Si el usuario existe y la contraseña es correcta
      if (user && await bcrypt.compare(pass, user.password)) {
     
        const { password, ...result } = user;
        return result;
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Error en validateUser: ${error.message}`, error.stack);
      throw error;
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
        role: user.role.name,
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
          role: {
            id: user.role.id,
            name: user.role.name,
          },
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error(`Error en login: ${error.message}`, error.stack);
      throw new UnauthorizedException('Error al iniciar sesión');
    }
  }
}