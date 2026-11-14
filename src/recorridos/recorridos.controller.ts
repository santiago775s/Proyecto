import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorador-usuario-actual.decorator.js';
import { JwtAuthGuard } from '../auth/guarda-jwt.guard.js';
import type { UsuarioAutenticado } from '../auth/interfaces/usuario-autenticado.interface.js';
import { PermissionsGuard } from '../autorizacion/permisos.guard.js';
import { PERMISOS } from '../autorizacion/permisos.constants.js';
import { Permissions } from '../autorizacion/permisos.decorator.js';
import { CrearSelloDto } from './dto/crear-sello.dto.js';
import { RecorridosService } from './recorridos.service.js';

@ApiTags('Recorridos')
@Controller('recorridos')
export class RecorridosController {
  constructor(private readonly recorridos: RecorridosService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions(PERMISOS.RECORRIDOS_PROPIOS)
  @ApiOperation({ summary: 'Listar los recorridos del usuario autenticado' })
  propios(@CurrentUser() usuario: UsuarioAutenticado) {
    return this.recorridos.propios(usuario.sub);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions(PERMISOS.RECORRIDOS_PROPIOS)
  @ApiOperation({ summary: 'Consultar un recorrido propio' })
  @ApiParam({ name: 'id', type: Number })
  porId(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.recorridos.porId(usuario.sub, id);
  }

  @Post(':id/sellos')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Sellar la siguiente parada del recorrido' })
  @ApiParam({ name: 'id', type: Number })
  sellar(@Param('id', ParseIntPipe) id: number, @Body() datos: CrearSelloDto) {
    return this.recorridos.sellarDemo(id, datos);
  }
}
