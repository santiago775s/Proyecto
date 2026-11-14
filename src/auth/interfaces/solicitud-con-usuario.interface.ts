import type { Request } from 'express';
import type { UsuarioAutenticado } from './usuario-autenticado.interface.js';

export interface RequestWithUser extends Request {
  usuario: UsuarioAutenticado;
}
