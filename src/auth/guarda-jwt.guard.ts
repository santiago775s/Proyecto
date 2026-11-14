import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { RequestWithUser } from './interfaces/solicitud-con-usuario.interface.js';
import type { PayloadJwt } from './interfaces/carga-jwt.interface.js';
import { TOKEN_AUDIENCE, TOKEN_ISSUER } from './jwt.constants.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authorization = request.headers.authorization;
    const match =
      typeof authorization === 'string'
        ? /^Bearer ([^\s]+)$/i.exec(authorization)
        : null;
    if (!match) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync<PayloadJwt>(match[1], {
        algorithms: ['HS256'],
        issuer: TOKEN_ISSUER,
        audience: TOKEN_AUDIENCE,
      });
      if (
        !Number.isSafeInteger(payload.sub) ||
        typeof payload.email !== 'string'
      ) {
        throw new UnauthorizedException();
      }
      request.usuario = { sub: payload.sub, email: payload.email };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
