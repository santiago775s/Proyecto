import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../autorizacion/autorizacion.module.js';
import { AuthModule } from '../auth/autenticacion.module.js';
import { RutasController } from './rutas.controller.js';
import { RutasService } from './rutas.service.js';

@Module({
  imports: [AuthModule, AuthorizationModule],
  controllers: [RutasController],
  providers: [RutasService],
  exports: [RutasService],
})
export class RutasModule {}
