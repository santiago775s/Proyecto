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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorador-usuario-actual.decorator.js';
import { JwtAuthGuard } from '../auth/guarda-jwt.guard.js';
import type { UsuarioAutenticado } from '../auth/interfaces/usuario-autenticado.interface.js';
import { PermissionsGuard } from '../autorizacion/permisos.guard.js';
import { PERMISOS } from '../autorizacion/permisos.constants.js';
import { Permissions } from '../autorizacion/permisos.decorator.js';
import { EstadisticasService } from '../estadisticas/estadisticas.service.js';
import { FiltroFechaDto } from '../estadisticas/dto/filtro-fecha.dto.js';
import { LugaresService } from './lugares.service.js';
import { CrearLugarDto } from './dto/crear-lugar.dto.js';
import { ActualizarLugarDto } from './dto/actualizar-lugar.dto.js';
import { FiltrarLugaresDto } from './dto/filtrar-lugares.dto.js';
import { RotarCodigoSelloDto } from './dto/rotar-codigo-sello.dto.js';

@ApiTags('Lugares')
@ApiBearerAuth()
@Controller('lugares')
export class LugaresController {
  constructor(
    private readonly lugaresService: LugaresService,
    private readonly estadisticas: EstadisticasService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISOS.LUGARES_LEER)
  @ApiOperation({ summary: 'Listar lugares con filtros y paginación' })
  @ApiOkResponse({ description: 'Página de lugares sin códigos de sello' })
  @ApiQuery({ name: 'categoria', required: false, enum: ['TIPICA', 'RAPIDA'] })
  @ApiQuery({ name: 'orden', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  obtenerTodos(@Query() filtros: FiltrarLugaresDto) {
    return this.lugaresService.obtenerTodos(
      filtros.categoria,
      filtros.page,
      filtros.limit,
      filtros.orden,
    );
  }

  @Get('estadisticas')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISOS.ESTADISTICAS_TODAS)
  @ApiOperation({ summary: 'Consultar conteos agregados de todos los lugares' })
  estadisticasTodas(@Query() filtro: FiltroFechaDto) {
    return this.estadisticas.deTodos(filtro);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISOS.LUGARES_LEER)
  @ApiOperation({ summary: 'Consultar un lugar por su identificador' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.lugaresService.obtenerPorId(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISOS.LUGARES_ADMINISTRAR)
  @ApiOperation({ summary: 'Crear un lugar' })
  @ApiCreatedResponse({ description: 'Lugar creado' })
  crear(@Body() datos: CrearLugarDto) {
    return this.lugaresService.crear(datos);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISOS.LUGARES_ADMINISTRAR)
  @ApiOperation({ summary: 'Reemplazar los datos de un lugar' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  reemplazar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: CrearLugarDto,
  ) {
    return this.lugaresService.reemplazar(id, datos);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISOS.LUGARES_ADMINISTRAR)
  @ApiOperation({ summary: 'Actualizar parcialmente un lugar' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarLugarDto,
  ) {
    return this.lugaresService.actualizar(id, datos);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISOS.LUGARES_ADMINISTRAR)
  @ApiOperation({ summary: 'Eliminar un lugar' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Lugar eliminado' })
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.lugaresService.eliminar(id);
  }

  @Post(':id/codigo/rotar')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISOS.SELLOS_CODIGO)
  @ApiOperation({ summary: 'Rotar el código de sello de un lugar autorizado' })
  @ApiParam({ name: 'id', type: Number })
  rotarCodigo(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() usuario: UsuarioAutenticado,
    @Body() datos: RotarCodigoSelloDto = new RotarCodigoSelloDto(),
  ) {
    return this.lugaresService.rotarCodigoSello(
      id,
      usuario.sub,
      datos.sucursalId,
    );
  }
}
