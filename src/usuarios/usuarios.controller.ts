import {
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guarda-jwt.guard.js';
import { PermissionsGuard } from '../autorizacion/permisos.guard.js';
import { PERMISOS } from '../autorizacion/permisos.constants.js';
import { Permissions } from '../autorizacion/permisos.decorator.js';
import { AsignarRolDto } from './dto/asignar-rol.dto.js';
import { UsuariosService } from './usuarios.service.js';

@ApiTags('Usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Patch(':id/rol')
  @Permissions(PERMISOS.USUARIOS_ROLES)
  @ApiOperation({ summary: 'Asignar rol y local a un usuario' })
  @ApiParam({ name: 'id', type: Number })
  asignarRol(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: AsignarRolDto,
  ) {
    return this.usuarios.asignarRol(id, datos);
  }
}
