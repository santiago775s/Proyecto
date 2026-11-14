import { SetMetadata } from '@nestjs/common';
import type { Permiso } from './permisos.constants.js';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permisos: Permiso[]) =>
  SetMetadata(PERMISSIONS_KEY, permisos);
