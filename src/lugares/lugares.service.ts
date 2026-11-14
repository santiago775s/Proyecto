import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import type { Paginado } from '../common/types/paginado.type.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CategoriaLugar } from './enums/categoria-lugar.enum.js';
import { CrearLugarDto } from './dto/crear-lugar.dto.js';
import { ActualizarLugarDto } from './dto/actualizar-lugar.dto.js';
import type { RotarCodigoSelloDto } from './dto/rotar-codigo-sello.dto.js';

const lugarPublicoSelect = {
  id: true,
  nombre: true,
  categoria: true,
  descripcion: true,
  createdAt: true,
  sucursales: {
    where: { activa: true },
    orderBy: { id: 'asc' },
    select: { id: true, nombre: true, direccion: true, activa: true },
  },
} satisfies Prisma.LugarSelect;

type LugarPublico = Prisma.LugarGetPayload<{
  select: typeof lugarPublicoSelect;
}>;

@Injectable()
export class LugaresService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerTodos(
    categoria?: CategoriaLugar,
    page = 1,
    limit = 10,
    orden: 'asc' | 'desc' = 'asc',
  ): Promise<Paginado<LugarPublico>> {
    const where: Prisma.LugarWhereInput = categoria ? { categoria } : {};
    const [data, total] = await Promise.all([
      this.prisma.lugar.findMany({
        where,
        select: lugarPublicoSelect,
        orderBy: { nombre: orden },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.lugar.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async contarTodos(): Promise<number> {
    return this.prisma.lugar.count();
  }

  async obtenerPorIds(ids: number[]): Promise<LugarPublico[]> {
    if (ids.length === 0) {
      return [];
    }
    return this.prisma.lugar.findMany({
      where: { id: { in: ids } },
      select: lugarPublicoSelect,
    });
  }

  async obtenerPorId(id: number): Promise<LugarPublico> {
    const lugar = await this.prisma.lugar.findUnique({
      where: { id },
      select: lugarPublicoSelect,
    });
    if (!lugar) {
      throw new NotFoundException('Lugar no encontrado');
    }
    return lugar;
  }

  async crear(datos: CrearLugarDto): Promise<LugarPublico> {
    return this.prisma.lugar.create({
      data: {
        nombre: datos.nombre,
        categoria: datos.categoria,
        descripcion: datos.descripcion,
        sucursales: {
          create: {
            nombre: 'Sucursal principal',
            direccion: datos.direccion,
            codigoSello: randomBytes(24).toString('hex'),
          },
        },
      },
      select: lugarPublicoSelect,
    });
  }

  async reemplazar(id: number, datos: CrearLugarDto): Promise<LugarPublico> {
    return this.prisma.$transaction(async (tx) => {
      await tx.lugar.update({
        where: { id },
        data: {
          nombre: datos.nombre,
          categoria: datos.categoria,
          descripcion: datos.descripcion,
        },
      });
      await this.actualizarDireccionPrincipal(tx, id, datos.direccion);
      return tx.lugar.findUniqueOrThrow({
        where: { id },
        select: lugarPublicoSelect,
      });
    });
  }

  async actualizar(
    id: number,
    datos: ActualizarLugarDto,
  ): Promise<LugarPublico> {
    return this.prisma.$transaction(async (tx) => {
      await tx.lugar.update({
        where: { id },
        data: {
          ...(datos.nombre !== undefined ? { nombre: datos.nombre } : {}),
          ...(datos.categoria !== undefined
            ? { categoria: datos.categoria }
            : {}),
          ...(datos.descripcion !== undefined
            ? { descripcion: datos.descripcion }
            : {}),
        },
      });
      if (datos.direccion !== undefined) {
        await this.actualizarDireccionPrincipal(tx, id, datos.direccion);
      }
      return tx.lugar.findUniqueOrThrow({
        where: { id },
        select: lugarPublicoSelect,
      });
    });
  }

  async eliminar(id: number): Promise<LugarPublico> {
    return this.prisma.lugar.delete({
      where: { id },
      select: lugarPublicoSelect,
    });
  }

  async rotarCodigoSello(
    id: number,
    usuarioId: number,
    sucursalId?: RotarCodigoSelloDto['sucursalId'],
  ): Promise<{ id: number; sucursalId: number; codigoSello: string }> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { rol: { select: { nombre: true } } },
    });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const lugar = await this.prisma.lugar.findFirst({
      where: {
        id,
        ...(usuario.rol.nombre === 'ADMIN' ? {} : { propietarioId: usuarioId }),
      },
      select: { id: true },
    });
    if (!lugar) {
      throw new NotFoundException('Lugar no encontrado');
    }
    const sucursales = await this.prisma.sucursal.findMany({
      where: {
        lugarId: id,
        activa: true,
        ...(sucursalId ? { id: sucursalId } : {}),
      },
      orderBy: { id: 'asc' },
      select: { id: true },
    });
    const sucursal =
      sucursalId || sucursales.length === 1 ? sucursales[0] : undefined;
    if (sucursalId && !sucursal) {
      throw new NotFoundException('Sucursal no encontrada');
    }
    if (sucursales.length > 1 && !sucursalId) {
      throw new BadRequestException(
        'Debes especificar la sucursal cuyo código quieres rotar',
      );
    }
    if (!sucursal) {
      throw new NotFoundException('No hay sucursales activas para este lugar');
    }

    const updated = await this.prisma.sucursal.update({
      where: { id: sucursal.id },
      data: { codigoSello: randomBytes(24).toString('hex') },
      select: { id: true, codigoSello: true },
    });
    return {
      id,
      sucursalId: updated.id,
      codigoSello: updated.codigoSello,
    };
  }

  private async actualizarDireccionPrincipal(
    tx: Prisma.TransactionClient,
    lugarId: number,
    direccion: string,
  ): Promise<void> {
    const sucursal = await tx.sucursal.findFirst({
      where: { lugarId, nombre: 'Sucursal principal' },
      select: { id: true },
    });
    if (sucursal) {
      await tx.sucursal.update({
        where: { id: sucursal.id },
        data: { direccion },
      });
    } else {
      await tx.sucursal.create({
        data: {
          lugarId,
          nombre: 'Sucursal principal',
          direccion,
          codigoSello: randomBytes(24).toString('hex'),
        },
      });
    }
  }
}
