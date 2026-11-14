import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(
    error: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ): void {
    const response = host.switchToHttp().getResponse<Response>();
    const errors: Record<string, { status: number; message: string }> = {
      P2002: {
        status: HttpStatus.CONFLICT,
        message: 'El registro ya existe',
      },
      P2025: {
        status: HttpStatus.NOT_FOUND,
        message: 'Registro no encontrado',
      },
      P2003: {
        status: HttpStatus.BAD_REQUEST,
        message: 'Referencia inválida',
      },
      P2034: {
        status: HttpStatus.CONFLICT,
        message: 'Conflicto concurrente; vuelve a intentar la operación',
      },
    };
    const mapped = errors[error.code] ?? {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Error interno',
    };

    response.status(mapped.status).json({
      statusCode: mapped.status,
      message: mapped.message,
    });
  }
}
