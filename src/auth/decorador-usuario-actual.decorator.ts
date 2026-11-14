import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestWithUser } from './interfaces/solicitud-con-usuario.interface.js';
import type { UsuarioAutenticado } from './interfaces/usuario-autenticado.interface.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UsuarioAutenticado =>
    context.switchToHttp().getRequest<RequestWithUser>().usuario,
);
