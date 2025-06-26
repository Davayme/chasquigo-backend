import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secreto_del_jwt',
    });
  }

  async validate(payload: any) {
    // Buscar el usuario en la base de datos
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.isDeleted) {
      return null;
    }

    // Devolver el objeto de usuario (se añadirá a la Request)
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}