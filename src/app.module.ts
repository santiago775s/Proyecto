import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/autenticacion.module.js';
import { AuthorizationModule } from './autorizacion/autorizacion.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { EstadisticasModule } from './estadisticas/estadisticas.module.js';
import { LugaresModule } from './lugares/lugares.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RecompensasModule } from './recompensas/recompensas.module.js';
import { RecorridosModule } from './recorridos/recorridos.module.js';
import { RutasModule } from './rutas/rutas.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
    AuthModule,
    AuthorizationModule,
    PrismaModule,
    EstadisticasModule,
    LugaresModule,
    RutasModule,
    RecorridosModule,
    RecompensasModule,
    UsuariosModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
