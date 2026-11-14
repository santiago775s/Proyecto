import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service.js';
import type { RequestWithUser } from '../auth/interfaces/solicitud-con-usuario.interface.js';
import type { Permiso } from './permisos.constants.js';
import { PERMISSIONS_KEY } from './permisos.decorator.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requeridos = this.reflector.getAllAndOverride<Permiso[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requeridos?.length) {
      throw new ForbiddenException();
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: request.usuario.sub },
      select: {
        rol: {
          select: {
            permisos: {
              select: { permiso: { select: { clave: true } } },
            },
          },
        },
      },
    });
    if (!usuario) {
      throw new UnauthorizedException();
    }

    const disponibles = new Set(
      usuario.rol.permisos.map(({ permiso }) => permiso.clave),
    );
    if (!requeridos.every((permiso) => disponibles.has(permiso))) {
      throw new ForbiddenException();
    }
    return true;
  }
}
