import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { FiltroFechaDto } from './dto/filtro-fecha.dto.js';

export interface EstadisticaLugar {
  lugarId: number;
  lugar: string;
  visitasTotales: number;
  visitantesUnicos: number;
  recorridosCompletados: number;
}

interface AggregadoSql {
  lugarId: number;
  visitantesUnicos: bigint;
  recorridosCompletados: bigint;
}

@Injectable()
export class EstadisticasService {
  constructor(private readonly prisma: PrismaService) {}

  async delLocal(
    usuarioId: number,
    filtro: FiltroFechaDto,
  ): Promise<EstadisticaLugar> {
    const lugar = await this.prisma.lugar.findUnique({
      where: { propietarioId: usuarioId },
      select: { id: true, nombre: true },
    });
    if (!lugar) {
      throw new NotFoundException('Local no encontrado');
    }

    return this.porLugar(lugar.id, lugar.nombre, filtro);
  }

  async deTodos(filtro: FiltroFechaDto): Promise<EstadisticaLugar[]> {
    const fecha = this.rangoFechas(filtro);
    const [lugares, conteos, visitantes] = await Promise.all([
      this.prisma.lugar.findMany({
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' },
      }),
      this.prisma.sello.groupBy({
        by: ['lugarId'],
        where: fecha ? { fecha } : {},
        _count: { _all: true },
      }),
      this.prisma.$queryRaw<AggregadoSql[]>(Prisma.sql`
        SELECT s."lugarId" AS "lugarId",
          COUNT(DISTINCT r."usuarioId") AS "visitantesUnicos",
          COUNT(DISTINCT r."id") FILTER (
            WHERE r."estado" = 'COMPLETADO'
          ) AS "recorridosCompletados"
        FROM "Sello" s
        INNER JOIN "Recorrido" r ON r."id" = s."recorridoId"
        WHERE (${fecha?.gte ?? null}::timestamptz IS NULL
            OR s."fecha" >= ${fecha?.gte ?? null})
          AND (${fecha?.lte ?? null}::timestamptz IS NULL
            OR s."fecha" <= ${fecha?.lte ?? null})
        GROUP BY s."lugarId"
      `),
    ]);

    const countByPlace = new Map(
      conteos.map(({ lugarId, _count }) => [lugarId, _count._all]),
    );
    const aggregateByPlace = new Map(
      visitantes.map((row) => [row.lugarId, row]),
    );

    return lugares.map(({ id, nombre }) => {
      const aggregate = aggregateByPlace.get(id);
      return {
        lugarId: id,
        lugar: nombre,
        visitasTotales: countByPlace.get(id) ?? 0,
        visitantesUnicos: Number(aggregate?.visitantesUnicos ?? 0n),
        recorridosCompletados: Number(aggregate?.recorridosCompletados ?? 0n),
      };
    });
  }

  private async porLugar(
    lugarId: number,
    nombre: string,
    filtro: FiltroFechaDto,
  ): Promise<EstadisticaLugar> {
    const fecha = this.rangoFechas(filtro);
    const where: Prisma.SelloWhereInput = {
      lugarId,
      ...(fecha ? { fecha } : {}),
    };
    const [visitasTotales, visitantes, recorridosCompletados] =
      await Promise.all([
        this.prisma.sello.count({ where }),
        this.prisma.recorrido.groupBy({
          by: ['usuarioId'],
          where: { sellos: { some: where } },
        }),
        this.prisma.recorrido.count({
          where: {
            estado: 'COMPLETADO',
            sellos: { some: where },
          },
        }),
      ]);

    return {
      lugarId,
      lugar: nombre,
      visitasTotales,
      visitantesUnicos: visitantes.length,
      recorridosCompletados,
    };
  }

  private rangoFechas(
    filtro: FiltroFechaDto,
  ): Prisma.DateTimeFilter | undefined {
    const desde = filtro.desde ? new Date(filtro.desde) : undefined;
    const hasta = filtro.hasta ? new Date(filtro.hasta) : undefined;
    if (desde && hasta && desde > hasta) {
      throw new BadRequestException(
        'La fecha inicial debe ser anterior a la fecha final',
      );
    }
    if (!desde && !hasta) {
      return undefined;
    }
    return {
      ...(desde ? { gte: desde } : {}),
      ...(hasta ? { lte: hasta } : {}),
    };
  }
}
