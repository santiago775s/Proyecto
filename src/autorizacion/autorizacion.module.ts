import { Module } from '@nestjs/common';
import { PermissionsGuard } from './permisos.guard.js';

@Module({
  providers: [PermissionsGuard],
  exports: [PermissionsGuard],
})
export class AuthorizationModule {}
