import {
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorador-usuario-actual.decorator.js';
import { JwtAuthGuard } from '../auth/guarda-jwt.guard.js';
import type { UsuarioAutenticado } from '../auth/interfaces/usuario-autenticado.interface.js';
import { PermissionsGuard } from '../autorizacion/permisos.guard.js';
import { PERMISOS } from '../autorizacion/permisos.constants.js';
import { Permissions } from '../autorizacion/permisos.decorator.js';
import { RecorridosService } from './recorridos.service.js';

@ApiTags('Recorridos')
@Controller('rutas')
export class RutasRecorridosController {
  constructor(private readonly recorridos: RecorridosService) {}

  @Post(':rutaId/recorridos')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions(PERMISOS.RECORRIDOS_PROPIOS)
  @ApiOperation({
    summary: 'Iniciar un recorrido propio en una ruta activa',
    description:
      'Acceso: USUARIO y ADMIN autenticados. LOCAL no tiene permiso para gestionar recorridos. El recorrido queda asociado al usuario autenticado.',
  })
  @ApiParam({ name: 'rutaId', type: Number })
  @ApiCreatedResponse({ description: 'Recorrido iniciado' })
  iniciar(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('rutaId', ParseIntPipe) rutaId: number,
  ) {
    return this.recorridos.iniciar(usuario.sub, rutaId);
  }
}
