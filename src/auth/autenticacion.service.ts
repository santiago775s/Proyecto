import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/iniciar-sesion.dto.js';
import { RegistrarDto } from './dto/registrar.dto.js';
import type { PayloadJwt } from './interfaces/carga-jwt.interface.js';
import { TOKEN_AUDIENCE, TOKEN_ISSUER } from './jwt.constants.js';
import { PasswordService } from './servicio-contrasena.service.js';

const usuarioPublicoSelect = {
  id: true,
  email: true,
  createdAt: true,
} as const;

@Injectable()
export class AuthService {
  private readonly dummyHash: Promise<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) {
    this.dummyHash = this.passwordService.hash(
      'rutero-dummy-password-never-used',
    );
  }

  async registrar(
    datos: RegistrarDto,
  ): Promise<{ id: number; email: string; createdAt: Date }> {
    const rol = await this.prisma.rol.findUniqueOrThrow({
      where: { nombre: 'USUARIO' },
      select: { id: true },
    });
    const usuario = await this.prisma.usuario.create({
      data: {
        email: datos.email.trim().toLowerCase(),
        passwordHash: await this.passwordService.hash(datos.password),
        rolId: rol.id,
      },
      select: usuarioPublicoSelect,
    });
    return usuario;
  }

  async login(datos: LoginDto): Promise<{
    access_token: string;
    token_type: 'Bearer';
    expires_in: number;
  }> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: datos.email.trim().toLowerCase() },
      select: { id: true, email: true, passwordHash: true },
    });
    const valido = usuario
      ? await this.passwordService.verify(datos.password, usuario.passwordHash)
      : await this.passwordService.verify(datos.password, await this.dummyHash);
    if (!usuario || !valido) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload: PayloadJwt = { sub: usuario.id, email: usuario.email };
    const access_token = await this.jwtService.signAsync(payload, {
      algorithm: 'HS256',
      expiresIn: '1h',
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    });
    return { access_token, token_type: 'Bearer', expires_in: 3600 };
  }
}
