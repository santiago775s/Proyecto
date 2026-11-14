import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/autenticacion.module.js';
import { AuthorizationModule } from '../autorizacion/autorizacion.module.js';
import { RecorridosController } from './recorridos.controller.js';
import { RutasRecorridosController } from './rutas-recorridos.controller.js';
import { RecorridosService } from './recorridos.service.js';

@Module({
  imports: [AuthModule, AuthorizationModule],
  controllers: [RecorridosController, RutasRecorridosController],
  providers: [RecorridosService],
  exports: [RecorridosService],
})
export class RecorridosModule {}
