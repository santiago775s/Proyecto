import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/autenticacion.module.js';
import { AuthorizationModule } from '../autorizacion/autorizacion.module.js';
import { EstadisticasController } from './estadisticas.controller.js';
import { EstadisticasService } from './estadisticas.service.js';

@Module({
  imports: [AuthModule, AuthorizationModule],
  controllers: [EstadisticasController],
  providers: [EstadisticasService],
  exports: [EstadisticasService],
})
export class EstadisticasModule {}
