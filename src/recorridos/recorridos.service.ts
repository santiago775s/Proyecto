import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoRecorrido, Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CrearSelloDto } from './dto/crear-sello.dto.js';

const recorridoSelect = {
  id: true,
  estado: true,
  fechaInicio: true,
  fechaFin: true,
  ruta: {
    select: {
      id: true,
      nombre: true,
      paradas: {
        orderBy: { orden: 'asc' },
        select: {
          orden: true,
          lugar: {
            select: {
              id: true,
              nombre: true,
              categoria: true,
              descripcion: true,
              sucursales: {
                where: { activa: true },
                orderBy: { id: 'asc' },
                select: { id: true, nombre: true, direccion: true },
              },
            },
          },
        },
      },
      recompensa: {
        select: {
          id: true,
          nombre: true,
          porcentaje: true,
          producto: true,
          diasVigencia: true,
        },
      },
    },
  },
  sellos: {
    orderBy: { orden: 'asc' },
    select: {
      id: true,
      lugarId: true,
      sucursalId: true,
      orden: true,
      fecha: true,
      sucursal: { select: { nombre: true } },
    },
  },
  recompensa: {
    select: {
      id: true,
      recompensaId: true,
      codigoCanje: true,
      fechaOtorgada: true,
      fechaVencimiento: true,
      canjeada: true,
      fechaCanje: true,
      recompensa: {
        select: {
          nombre: true,
          porcentaje: true,
          producto: true,
        },
      },
    },
  },
} satisfies Prisma.RecorridoSelect;

const usuarioDemoEmail = 'turista@rutero.test';

type RecorridoPublico = Prisma.RecorridoGetPayload<{
  select: typeof recorridoSelect;
}>;

@Injectable()
export class RecorridosService {
  constructor(private readonly prisma: PrismaService) {}

  async iniciarDemo(rutaId: number): Promise<RecorridoPublico> {
    const usuarioId = await this.obtenerUsuarioDemoId();
    return this.iniciar(usuarioId, rutaId);
  }

  async iniciar(usuarioId: number, rutaId: number): Promise<RecorridoPublico> {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const ruta = await tx.ruta.findFirst({
            where: { id: rutaId, activa: true },
            select: { id: true, paradas: { select: { id: true }, take: 1 } },
          });
          if (!ruta) {
            throw new NotFoundException('Ruta no encontrada');
          }
          if (ruta.paradas.length === 0) {
            throw new ConflictException(
              'No se puede iniciar una ruta sin paradas',
            );
          }
          const enCurso = await tx.recorrido.findFirst({
            where: {
              usuarioId,
              rutaId,
              estado: EstadoRecorrido.EN_CURSO,
            },
            select: { id: true },
          });
          if (enCurso) {
            throw new ConflictException('Ya tienes un recorrido en curso');
          }
          return tx.recorrido.create({
            data: { usuarioId, rutaId },
            select: recorridoSelect,
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2002' || error.code === 'P2034')
      ) {
        throw new ConflictException('Ya tienes un recorrido en curso');
      }
      throw error;
    }
  }

  async sellar(usuarioId: number, recorridoId: number, datos: CrearSelloDto) {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const recorrido = await tx.recorrido.findFirst({
            where: { id: recorridoId, usuarioId },
            select: {
              estado: true,
              sellos: { orderBy: { orden: 'asc' }, select: { lugarId: true } },
              ruta: {
                select: {
                  paradas: {
                    orderBy: { orden: 'asc' },
                    select: {
                      orden: true,
                      lugarId: true,
                      lugar: {
                        select: {
                          sucursales: {
                            where: { activa: true },
                            orderBy: { id: 'asc' },
                            select: { id: true, lugarId: true },
                          },
                        },
                      },
                    },
                  },
                  recompensa: {
                    select: { id: true, diasVigencia: true },
                  },
                },
              },
            },
          });
          if (!recorrido) {
            throw new NotFoundException('Recorrido no encontrado');
          }
          if (recorrido.estado !== EstadoRecorrido.EN_CURSO) {
            throw new ConflictException('El recorrido ya está completado');
          }

          const siguiente = recorrido.ruta.paradas[recorrido.sellos.length];
          if (!siguiente || siguiente.lugarId !== datos.lugarId) {
            throw new ConflictException(
              'La parada no corresponde al orden de la ruta',
            );
          }
          const sucursales = siguiente.lugar.sucursales;
          const sucursal = datos.sucursalId
            ? sucursales.find(({ id }) => id === datos.sucursalId)
            : sucursales.length === 1
              ? sucursales[0]
              : undefined;
          if (datos.sucursalId && !sucursal) {
            throw new BadRequestException(
              'La sucursal no está activa o no pertenece a esta parada',
            );
          }
          if (!sucursal && sucursales.length > 1) {
            throw new BadRequestException(
              'Debes seleccionar una sucursal para esta parada',
            );
          }
          if (!sucursal) {
            throw new ConflictException(
              'La parada no tiene una sucursal activa configurada',
            );
          }

          const sello = await tx.sello.create({
            data: {
              recorridoId,
              lugarId: datos.lugarId,
              sucursalId: sucursal.id,
              orden: siguiente.orden,
            },
          });
          const completado =
            recorrido.sellos.length + 1 === recorrido.ruta.paradas.length;
          if (!completado) {
            return { sello, completado };
          }

          await tx.recorrido.update({
            where: { id: recorridoId },
            data: {
              estado: EstadoRecorrido.COMPLETADO,
              fechaFin: new Date(),
            },
          });
          const recompensa = recorrido.ruta.recompensa
            ? await tx.recompensaOtorgada.create({
                data: {
                  recorridoId,
                  recompensaId: recorrido.ruta.recompensa.id,
                  codigoCanje: randomBytes(24).toString('hex'),
                  fechaVencimiento: new Date(
                    Date.now() +
                      recorrido.ruta.recompensa.diasVigencia *
                        24 *
                        60 *
                        60 *
                        1000,
                  ),
                },
                include: { recompensa: true },
              })
            : null;
          return { sello, completado: true, recompensa };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2002' || error.code === 'P2034')
      ) {
        throw new ConflictException(
          'La visita ya se confirmó o el recorrido cambió; vuelve a consultar el recorrido',
        );
      }
      throw error;
    }
  }

  async sellarDemo(recorridoId: number, datos: CrearSelloDto) {
    const usuarioId = await this.obtenerUsuarioDemoId();
    return this.sellar(usuarioId, recorridoId, datos);
  }

  async propios(usuarioId: number): Promise<RecorridoPublico[]> {
    return this.prisma.recorrido.findMany({
      where: { usuarioId },
      select: recorridoSelect,
      orderBy: { fechaInicio: 'desc' },
    });
  }

  async porId(usuarioId: number, recorridoId: number) {
    const recorrido = await this.prisma.recorrido.findFirst({
      where: { id: recorridoId, usuarioId },
      select: recorridoSelect,
    });
    if (!recorrido) {
      throw new NotFoundException('Recorrido no encontrado');
    }
    const siguienteIndex = recorrido.sellos.length;
    const paradas = recorrido.ruta.paradas.map((parada, index) => ({
      ...parada,
      estado:
        index < siguienteIndex
          ? 'HECHA'
          : index === siguienteIndex &&
              recorrido.estado === EstadoRecorrido.EN_CURSO
            ? 'SIGUIENTE'
            : 'PENDIENTE',
    }));
    return {
      ...recorrido,
      ruta: { ...recorrido.ruta, paradas },
      siguienteParada: paradas[siguienteIndex] ?? null,
    };
  }

  private async obtenerUsuarioDemoId(): Promise<number> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: usuarioDemoEmail },
      select: { id: true },
    });
    if (!usuario) {
      throw new NotFoundException(
        'No existe el usuario demo; ejecuta npm run db:seed',
      );
    }
    return usuario.id;
  }
}
