import { Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { RecorridosService } from './recorridos.service.js';

@ApiTags('Recorridos')
@Controller('rutas')
export class RutasRecorridosController {
  constructor(private readonly recorridos: RecorridosService) {}

  @Post(':rutaId/recorridos')
  @ApiOperation({ summary: 'Iniciar el recorrido demo de una ruta activa' })
  @ApiParam({ name: 'rutaId', type: Number })
  @ApiCreatedResponse({ description: 'Recorrido iniciado' })
  iniciar(@Param('rutaId', ParseIntPipe) rutaId: number) {
    return this.recorridos.iniciarDemo(rutaId);
  }
}
