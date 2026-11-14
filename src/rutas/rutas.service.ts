import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ActualizarParadasDto } from './dto/actualizar-paradas.dto.js';
import { ActualizarRutaDto } from './dto/actualizar-ruta.dto.js';
import { CrearRecompensaDto } from './dto/crear-recompensa.dto.js';
import { CrearRutaDto } from './dto/crear-ruta.dto.js';

const rutaSelect = {
  id: true,
  nombre: true,
  descripcion: true,
  activa: true,
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
      lugares: { select: { lugarId: true } },
    },
  },
} satisfies Prisma.RutaSelect;

type RutaPublica = Prisma.RutaGetPayload<{ select: typeof rutaSelect }>;

@Injectable()
export class RutasService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerTodas(): Promise<RutaPublica[]> {
    return this.prisma.ruta.findMany({
      where: { activa: true },
      select: rutaSelect,
      orderBy: { nombre: 'asc' },
    });
  }

  async obtenerPorId(id: number): Promise<RutaPublica> {
    const ruta = await this.prisma.ruta.findFirst({
      where: { id, activa: true },
      select: rutaSelect,
    });
    if (!ruta) {
      throw new NotFoundException('Ruta no encontrada');
    }
    return ruta;
  }

  async crear(datos: CrearRutaDto): Promise<RutaPublica> {
    return this.prisma.ruta.create({
      data: datos,
      select: rutaSelect,
    });
  }

  async actualizar(id: number, datos: ActualizarRutaDto): Promise<RutaPublica> {
    return this.prisma.ruta.update({
      where: { id },
      data: datos,
      select: rutaSelect,
    });
  }

  async eliminar(id: number): Promise<RutaPublica> {
    return this.prisma.$transaction(
      async (tx) => {
        const existe = await tx.ruta.findUnique({
          where: { id },
          select: { id: true },
        });
        if (!existe) {
          throw new NotFoundException('Ruta no encontrada');
        }
        if (await tx.recorrido.count({ where: { rutaId: id } })) {
          throw new ConflictException(
            'No se puede eliminar una ruta con recorridos asociados',
          );
        }
        return tx.ruta.delete({ where: { id }, select: rutaSelect });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async actualizarParadas(
    id: number,
    datos: ActualizarParadasDto,
  ): Promise<RutaPublica> {
    const ordenes = datos.paradas
      .map(({ orden }) => orden)
      .sort((a, b) => a - b);
    const lugares = datos.paradas.map(({ lugarId }) => lugarId);
    if (
      new Set(lugares).size !== lugares.length ||
      ordenes.some((orden, index) => orden !== index + 1)
    ) {
      throw new ConflictException(
        'Las paradas deben tener lugares y órdenes únicos y consecutivos desde 1',
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        const existe = await tx.ruta.findUnique({
          where: { id },
          select: { id: true },
        });
        if (!existe) {
          throw new NotFoundException('Ruta no encontrada');
        }
        if (await tx.recorrido.count({ where: { rutaId: id } })) {
          throw new ConflictException(
            'No se pueden cambiar paradas de una ruta con recorridos asociados',
          );
        }

        const idsExistentes = await tx.lugar.findMany({
          where: { id: { in: lugares } },
          select: { id: true },
        });
        if (idsExistentes.length !== lugares.length) {
          throw new NotFoundException('Una o más paradas no existen');
        }

        await tx.rutaLugar.deleteMany({ where: { rutaId: id } });
        await tx.rutaLugar.createMany({
          data: datos.paradas.map(({ lugarId, orden }) => ({
            rutaId: id,
            lugarId,
            orden,
          })),
        });
        return tx.ruta.findUniqueOrThrow({
          where: { id },
          select: rutaSelect,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async crearRecompensa(
    rutaId: number,
    datos: CrearRecompensaDto,
  ): Promise<{
    id: number;
    rutaId: number;
    nombre: string;
    porcentaje: number;
    producto: string | null;
    diasVigencia: number;
  }> {
    return this.prisma.$transaction(async (tx) => {
      const ruta = await tx.ruta.findUnique({
        where: { id: rutaId },
        select: { id: true },
      });
      if (!ruta) {
        throw new NotFoundException('Ruta no encontrada');
      }
      if (await tx.recompensa.findUnique({ where: { rutaId } })) {
        throw new ConflictException('La ruta ya tiene una recompensa');
      }
      const paradas = await tx.rutaLugar.findMany({
        where: { rutaId },
        select: { lugarId: true },
      });
      const lugarIds = datos.lugarIds ?? paradas.map(({ lugarId }) => lugarId);
      if (lugarIds.length === 0) {
        throw new ConflictException(
          'La recompensa debe ser canjeable en al menos un lugar',
        );
      }
      const paradasIds = new Set(paradas.map(({ lugarId }) => lugarId));
      if (lugarIds.some((lugarId) => !paradasIds.has(lugarId))) {
        throw new BadRequestException(
          'La recompensa solo puede canjearse en lugares de esta ruta',
        );
      }
      const lugaresExistentes = await tx.lugar.count({
        where: { id: { in: lugarIds } },
      });
      if (lugaresExistentes !== lugarIds.length) {
        throw new NotFoundException('Uno o más lugares no existen');
      }
      return tx.recompensa.create({
        data: {
          rutaId,
          nombre: datos.nombre,
          porcentaje: datos.porcentaje,
          producto: datos.producto,
          diasVigencia: datos.diasVigencia,
          lugares: {
            create: lugarIds.map((lugarId) => ({ lugarId })),
          },
        },
        select: {
          id: true,
          rutaId: true,
          nombre: true,
          porcentaje: true,
          producto: true,
          diasVigencia: true,
        },
      });
    });
  }
}
