import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guarda-jwt.guard.js';
import { PermissionsGuard } from '../autorizacion/permisos.guard.js';
import { PERMISOS } from '../autorizacion/permisos.constants.js';
import { Permissions } from '../autorizacion/permisos.decorator.js';
import { ActualizarParadasDto } from './dto/actualizar-paradas.dto.js';
import { ActualizarRutaDto } from './dto/actualizar-ruta.dto.js';
import { CrearRecompensaDto } from './dto/crear-recompensa.dto.js';
import { CrearRutaDto } from './dto/crear-ruta.dto.js';
import { RutasService } from './rutas.service.js';

@ApiTags('Rutas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('rutas')
export class RutasController {
  constructor(private readonly rutasService: RutasService) {}

  @Get()
  @Permissions(PERMISOS.LUGARES_LEER)
  @ApiOperation({
    summary: 'Listar rutas activas con sus paradas y recompensa',
  })
  obtenerTodas() {
    return this.rutasService.obtenerTodas();
  }

  @Get(':id')
  @Permissions(PERMISOS.LUGARES_LEER)
  @ApiOperation({ summary: 'Consultar una ruta activa por su identificador' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.rutasService.obtenerPorId(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISOS.RUTAS_ADMINISTRAR)
  @ApiOperation({ summary: 'Crear una ruta' })
  @ApiCreatedResponse({ description: 'Ruta creada' })
  crear(@Body() datos: CrearRutaDto) {
    return this.rutasService.crear(datos);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISOS.RUTAS_ADMINISTRAR)
  @ApiOperation({ summary: 'Actualizar una ruta' })
  @ApiParam({ name: 'id', type: Number })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarRutaDto,
  ) {
    return this.rutasService.actualizar(id, datos);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISOS.RUTAS_ADMINISTRAR)
  @ApiOperation({ summary: 'Eliminar una ruta' })
  @ApiParam({ name: 'id', type: Number })
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.rutasService.eliminar(id);
  }

  @Put(':id/paradas')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISOS.RUTAS_ADMINISTRAR)
  @ApiOperation({ summary: 'Reemplazar las paradas ordenadas de una ruta' })
  @ApiParam({ name: 'id', type: Number })
  actualizarParadas(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarParadasDto,
  ) {
    return this.rutasService.actualizarParadas(id, datos);
  }

  @Post(':id/recompensa')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISOS.RUTAS_ADMINISTRAR)
  @ApiOperation({ summary: 'Crear la recompensa de una ruta' })
  @ApiParam({ name: 'id', type: Number })
  crearRecompensa(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: CrearRecompensaDto,
  ) {
    return this.rutasService.crearRecompensa(id, datos);
  }
}
