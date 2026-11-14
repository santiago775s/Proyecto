import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/autenticacion.module.js';
import { AuthorizationModule } from '../autorizacion/autorizacion.module.js';
import { EstadisticasModule } from '../estadisticas/estadisticas.module.js';
import { LugaresController } from './lugares.controller.js';
import { LugaresService } from './lugares.service.js';

@Module({
  imports: [AuthModule, AuthorizationModule, EstadisticasModule],
  controllers: [LugaresController],
  providers: [LugaresService],
  exports: [LugaresService],
})
export class LugaresModule {}
