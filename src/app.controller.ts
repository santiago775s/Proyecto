import { Controller, Get } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Consultar el estado de la API',
    description: 'Acceso público, no requiere token.',
  })
  obtenerEstado() {
    return this.appService.obtenerEstado();
  }
}
