import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AsignarRolDto } from './dto/asignar-rol.dto.js';

const usuarioAdminSelect = {
  id: true,
  email: true,
  createdAt: true,
  rol: { select: { nombre: true } },
  lugar: { select: { id: true, nombre: true } },
} satisfies Prisma.UsuarioSelect;

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async asignarRol(
    id: number,
    datos: AsignarRolDto,
  ): Promise<Prisma.UsuarioGetPayload<{ select: typeof usuarioAdminSelect }>> {
    if (datos.rol === 'LOCAL' && datos.lugarId === undefined) {
      throw new BadRequestException('lugarId es obligatorio para el rol LOCAL');
    }
    if (datos.rol !== 'LOCAL' && datos.lugarId !== undefined) {
      throw new BadRequestException('lugarId solo se admite para el rol LOCAL');
    }

    return this.prisma.$transaction(
      async (tx) => {
        const [usuario, rol] = await Promise.all([
          tx.usuario.findUnique({
            where: { id },
            select: { id: true, rol: { select: { nombre: true } } },
          }),
          tx.rol.findUnique({
            where: { nombre: datos.rol },
            select: { id: true },
          }),
        ]);
        if (!usuario || !rol) {
          throw new NotFoundException('Usuario o rol no encontrado');
        }

        if (datos.rol === 'LOCAL') {
          const lugar = await tx.lugar.findUnique({
            where: { id: datos.lugarId },
            select: { id: true, propietarioId: true },
          });
          if (!lugar) {
            throw new NotFoundException('Lugar no encontrado');
          }
          if (lugar.propietarioId && lugar.propietarioId !== id) {
            throw new ConflictException(
              'El lugar ya está asignado a otro usuario',
            );
          }
          if (usuario.rol.nombre === 'LOCAL') {
            await tx.lugar.updateMany({
              where: { propietarioId: id, id: { not: lugar.id } },
              data: { propietarioId: null },
            });
          }
          await tx.usuario.update({
            where: { id },
            data: { rolId: rol.id },
          });
          await tx.lugar.update({
            where: { id: lugar.id },
            data: { propietarioId: id },
          });
        } else {
          if (usuario.rol.nombre === 'LOCAL') {
            await tx.lugar.updateMany({
              where: { propietarioId: id },
              data: { propietarioId: null },
            });
          }
          await tx.usuario.update({
            where: { id },
            data: { rolId: rol.id },
          });
        }

        return tx.usuario.findUniqueOrThrow({
          where: { id },
          select: usuarioAdminSelect,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
