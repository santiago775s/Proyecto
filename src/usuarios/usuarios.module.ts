import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/autenticacion.module.js';
import { AuthorizationModule } from '../autorizacion/autorizacion.module.js';
import { UsuariosController } from './usuarios.controller.js';
import { UsuariosService } from './usuarios.service.js';

@Module({
  imports: [AuthModule, AuthorizationModule],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
