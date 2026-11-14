import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const recompensaPropiaSelect = {
  id: true,
  recorridoId: true,
  codigoCanje: true,
  fechaOtorgada: true,
  fechaVencimiento: true,
  canjeada: true,
  fechaCanje: true,
  recompensa: {
    select: { nombre: true, porcentaje: true, producto: true },
  },
} as const;

@Injectable()
export class RecompensasService {
  constructor(private readonly prisma: PrismaService) {}

  async propias(usuarioId: number): Promise<
    Prisma.RecompensaOtorgadaGetPayload<{
      select: typeof recompensaPropiaSelect;
    }>[]
  > {
    return this.prisma.recompensaOtorgada.findMany({
      where: { recorrido: { usuarioId } },
      select: recompensaPropiaSelect,
      orderBy: { id: 'desc' },
    });
  }

  async pendientesDelLocal(usuarioId: number): Promise<
    Prisma.RecompensaOtorgadaGetPayload<{
      select: typeof recompensaPropiaSelect;
    }>[]
  > {
    return this.prisma.recompensaOtorgada.findMany({
      where: {
        canjeada: false,
        fechaVencimiento: { gt: new Date() },
        recompensa: {
          lugares: {
            some: {
              lugar: {
                propietarioId: usuarioId,
                sucursales: { some: { activa: true } },
              },
            },
          },
        },
      },
      select: recompensaPropiaSelect,
      orderBy: { id: 'asc' },
    });
  }

  async entregar(
    id: number,
    usuarioId: number,
    sucursalId?: number,
  ): Promise<
    Prisma.RecompensaOtorgadaGetPayload<{
      select: typeof recompensaPropiaSelect;
    }>
  > {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { rol: { select: { nombre: true } } },
    });
    if (!usuario) {
      throw new NotFoundException('Recompensa no encontrada');
    }

    const esAdmin = usuario.rol.nombre === 'ADMIN';
    const recompensa = await this.prisma.recompensaOtorgada.findFirst({
      where: {
        id,
        ...(esAdmin
          ? {}
          : {
              recompensa: {
                lugares: {
                  some: {
                    lugar: {
                      propietarioId: usuarioId,
                      ...(sucursalId
                        ? {
                            sucursales: {
                              some: { id: sucursalId, activa: true },
                            },
                          }
                        : { sucursales: { some: { activa: true } } }),
                    },
                  },
                },
              },
            }),
      },
      select: {
        id: true,
        canjeada: true,
        fechaVencimiento: true,
        recompensa: {
          select: {
            lugares: {
              select: {
                lugar: {
                  select: {
                    sucursales: {
                      where: {
                        activa: true,
                        ...(sucursalId ? { id: sucursalId } : {}),
                      },
                      select: { id: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!recompensa) {
      throw new NotFoundException('Recompensa no encontrada');
    }
    if (recompensa.canjeada) {
      throw new ConflictException('La recompensa ya fue canjeada');
    }
    const sucursales = recompensa.recompensa.lugares.flatMap(
      ({ lugar }) => lugar.sucursales,
    );
    if (
      sucursalId &&
      !sucursales.some(({ id: idSucursal }) => idSucursal === sucursalId)
    ) {
      throw new BadRequestException(
        'La sucursal no está activa o no puede canjear esta recompensa',
      );
    }
    if (!esAdmin && !sucursalId && sucursales.length > 1) {
      throw new BadRequestException(
        'Debes seleccionar la sucursal donde canjear la recompensa',
      );
    }
    const sucursalCanje = sucursalId
      ? sucursalId
      : !esAdmin && sucursales.length === 1
        ? sucursales[0].id
        : null;

    const actualizada = await this.prisma.recompensaOtorgada.updateMany({
      where: { id, canjeada: false, fechaVencimiento: { gt: new Date() } },
      data: {
        canjeada: true,
        fechaCanje: new Date(),
        sucursalCanjeId: sucursalCanje,
      },
    });
    if (actualizada.count !== 1) {
      throw new ConflictException(
        'La recompensa ya fue canjeada o está vencida',
      );
    }
    return this.prisma.recompensaOtorgada.findUniqueOrThrow({
      where: { id },
      select: recompensaPropiaSelect,
    });
  }
}
