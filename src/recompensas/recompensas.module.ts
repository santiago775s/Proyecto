import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/autenticacion.module.js';
import { AuthorizationModule } from '../autorizacion/autorizacion.module.js';
import {
  RecompensasController,
  RecompensasLocalController,
} from './recompensas.controller.js';
import { RecompensasService } from './recompensas.service.js';

@Module({
  imports: [AuthModule, AuthorizationModule],
  controllers: [RecompensasController, RecompensasLocalController],
  providers: [RecompensasService],
  exports: [RecompensasService],
})
export class RecompensasModule {}
