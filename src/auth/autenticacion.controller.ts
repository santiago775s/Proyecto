import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './autenticacion.service.js';
import { LoginDto } from './dto/iniciar-sesion.dto.js';
import { RegistrarDto } from './dto/registrar.dto.js';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registro')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Registrar una cuenta USUARIO o LOCAL',
    description:
      'Acceso público, no requiere token. Solo admite los roles USUARIO o LOCAL; el rol ADMIN no puede registrarse mediante este endpoint.',
  })
  @ApiCreatedResponse({ description: 'Cuenta creada sin exponer el hash' })
  registrar(@Body() datos: RegistrarDto) {
    return this.authService.registrar(datos);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Iniciar sesión y obtener un JWT',
    description:
      'Acceso público, no requiere token. Disponible para cuentas ADMIN, LOCAL y USUARIO.',
  })
  login(@Body() datos: LoginDto) {
    return this.authService.login(datos);
  }
}
