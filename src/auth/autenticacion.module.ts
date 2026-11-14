import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './autenticacion.controller.js';
import { AuthService } from './autenticacion.service.js';
import { JwtAuthGuard } from './guarda-jwt.guard.js';
import { TOKEN_AUDIENCE, TOKEN_ISSUER } from './jwt.constants.js';
import { PasswordService } from './servicio-contrasena.service.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.getOrThrow<string>('JWT_SECRET');
        if (Buffer.byteLength(secret, 'utf8') < 32) {
          throw new Error('JWT_SECRET debe tener al menos 32 bytes');
        }
        return {
          secret,
          signOptions: {
            algorithm: 'HS256' as const,
            expiresIn: '1h' as const,
            issuer: TOKEN_ISSUER,
            audience: TOKEN_AUDIENCE,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, JwtAuthGuard],
  exports: [PasswordService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
