import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorador-usuario-actual.decorator.js';
import { JwtAuthGuard } from '../auth/guarda-jwt.guard.js';
import type { UsuarioAutenticado } from '../auth/interfaces/usuario-autenticado.interface.js';
import { PermissionsGuard } from '../autorizacion/permisos.guard.js';
import { PERMISOS } from '../autorizacion/permisos.constants.js';
import { Permissions } from '../autorizacion/permisos.decorator.js';
import { FiltroFechaDto } from './dto/filtro-fecha.dto.js';
import { EstadisticasService } from './estadisticas.service.js';

@ApiTags('Estadísticas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('locales/me')
export class EstadisticasController {
  constructor(private readonly estadisticas: EstadisticasService) {}

  @Get('estadisticas')
  @Permissions(PERMISOS.ESTADISTICAS_PROPIAS)
  @ApiOperation({ summary: 'Consultar conteos del local asignado al usuario' })
  propias(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Query() filtro: FiltroFechaDto,
  ) {
    return this.estadisticas.delLocal(usuario.sub, filtro);
  }
}
