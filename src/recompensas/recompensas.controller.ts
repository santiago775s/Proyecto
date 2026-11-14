import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
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
import { CanjearRecompensaDto } from './dto/canjear-recompensa.dto.js';
import { RecompensasService } from './recompensas.service.js';

@ApiTags('Recompensas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('recompensas')
export class RecompensasController {
  constructor(private readonly recompensas: RecompensasService) {}

  @Get('me')
  @Permissions(PERMISOS.RECORRIDOS_PROPIOS)
  @ApiOperation({ summary: 'Listar recompensas del usuario autenticado' })
  propias(@CurrentUser() usuario: UsuarioAutenticado) {
    return this.recompensas.propias(usuario.sub);
  }

  @Patch(':id/entregar')
  @Permissions(PERMISOS.RECOMPENSAS_CANJEAR)
  @ApiOperation({ summary: 'Canjear una recompensa autorizada' })
  @ApiParam({ name: 'id', type: Number })
  entregar(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: CanjearRecompensaDto = new CanjearRecompensaDto(),
  ) {
    return this.recompensas.entregar(id, usuario.sub, datos.sucursalId);
  }
}

@ApiTags('Recompensas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('locales/me/recompensas')
export class RecompensasLocalController {
  constructor(private readonly recompensas: RecompensasService) {}

  @Get('pendientes')
  @Permissions(PERMISOS.RECOMPENSAS_CANJEAR)
  @ApiOperation({
    summary: 'Listar recompensas pendientes del local sin datos personales',
  })
  pendientes(@CurrentUser() usuario: UsuarioAutenticado) {
    return this.recompensas.pendientesDelLocal(usuario.sub);
  }
}
