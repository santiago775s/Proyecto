import { randomBytes } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../src/generated/prisma/client.js';
import { PasswordService } from '../src/auth/servicio-contrasena.service.js';
import { isEmail } from 'class-validator';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL es obligatorio para ejecutar el seed');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const passwordService = new PasswordService();

const permisos = [
  { clave: 'lugares:leer', descripcion: 'Consultar lugares y rutas' },
  { clave: 'lugares:administrar', descripcion: 'Administrar lugares' },
  {
    clave: 'rutas:administrar',
    descripcion: 'Administrar rutas y recompensas',
  },
  { clave: 'recorridos:propios', descripcion: 'Gestionar recorridos propios' },
  {
    clave: 'estadisticas:propias',
    descripcion: 'Consultar estadísticas del lugar propio',
  },
  {
    clave: 'estadisticas:todas',
    descripcion: 'Consultar estadísticas de todos los lugares',
  },
  { clave: 'sellos:codigo', descripcion: 'Rotar el código de sello del lugar' },
  {
    clave: 'recompensas:canjear',
    descripcion: 'Canjear recompensas autorizadas',
  },
  { clave: 'usuarios:roles', descripcion: 'Asignar roles a usuarios' },
] satisfies Prisma.PermisoCreateManyInput[];

const roles = {
  USUARIO: ['lugares:leer', 'recorridos:propios'],
  LOCAL: [
    'lugares:leer',
    'estadisticas:propias',
    'sellos:codigo',
    'recompensas:canjear',
  ],
  ADMIN: permisos.map(({ clave }) => clave),
} satisfies Record<string, readonly string[]>;

const paradas: {
  nombre: string;
  categoria: 'TIPICA' | 'RAPIDA';
  nombreSucursal: string;
  direccion: string;
  descripcion: string;
  sucursales?: readonly { nombre: string; direccion: string }[];
}[] = [
  {
    nombre: 'Patio San Alberto',
    categoria: 'TIPICA',
    nombreSucursal: 'Nº 20',
    direccion: 'Calle San Alberto, Sucre',
    descripcion: 'Salteñas tradicionales de Sucre.',
  },
  {
    nombre: 'Regional',
    categoria: 'TIPICA',
    nombreSucursal: 'Sucursal principal',
    direccion: 'Centro histórico, Sucre',
    descripcion: 'Comida regional de Chuquisaca.',
  },
  {
    nombre: 'Mary Salteñas',
    categoria: 'TIPICA',
    nombreSucursal: 'Punto de venta 1',
    direccion: 'Centro histórico, Sucre',
    descripcion: 'Salteñas de Sucre con más de un punto de venta.',
    sucursales: [
      { nombre: 'Punto de venta 1', direccion: 'Centro histórico, Sucre' },
      { nombre: 'Punto de venta 2', direccion: 'Plaza 25 de Mayo, Sucre' },
    ],
  },
  {
    nombre: 'Pato Salteñas',
    categoria: 'TIPICA',
    nombreSucursal: 'Sucursal principal',
    direccion: 'Avenida del Maestro, Sucre',
    descripcion: 'Salteñas tradicionales.',
  },
  {
    nombre: 'Chocolates para ti',
    categoria: 'TIPICA',
    nombreSucursal: 'Sucursal principal',
    direccion: 'Sucre, Chuquisaca',
    descripcion: 'Chocolatería local participante en la ruta del chocolate.',
  },
  {
    nombre: 'Taboada',
    categoria: 'TIPICA',
    nombreSucursal: 'Sucursal principal',
    direccion: 'Sucre, Chuquisaca',
    descripcion: 'Parada de la ruta para descubrir chocolates de Sucre.',
  },
  {
    nombre: 'Sucre',
    categoria: 'TIPICA',
    nombreSucursal: 'Sucursal principal',
    direccion: 'Sucre, Chuquisaca',
    descripcion: 'Parada final de la ruta gastronómica del chocolate.',
  },
  {
    nombre: 'Wilbo',
    categoria: 'TIPICA',
    nombreSucursal: 'Sucursal principal',
    direccion: 'Sucre, Chuquisaca',
    descripcion: 'Chocolatería de Sucre y destino final de la ruta.',
  },
] as const;

function getSeedValue(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`${key} es obligatorio para ejecutar el seed`);
  }
  return value;
}

async function main(): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production';
  const demoEnabled = process.env.RUTERO_ENABLE_DEMO_USERS === 'true';
  if (isProduction && demoEnabled) {
    throw new Error('Las cuentas de prueba no se permiten en producción');
  }
  const demoUsers = demoEnabled
    ? {
        admin: {
          email: getSeedValue('RUTERO_ADMIN_EMAIL').toLowerCase(),
          password: getSeedValue('RUTERO_ADMIN_PASSWORD'),
        },
        local: {
          email: getSeedValue('RUTERO_LOCAL_EMAIL').toLowerCase(),
          password: getSeedValue('RUTERO_LOCAL_PASSWORD'),
        },
        usuario: {
          email: getSeedValue('RUTERO_USER_EMAIL').toLowerCase(),
          password: getSeedValue('RUTERO_USER_PASSWORD'),
        },
      }
    : null;
  const bootstrapAdmin = isProduction
    ? {
        email: getSeedValue('BOOTSTRAP_ADMIN_EMAIL').toLowerCase(),
        password: getSeedValue('BOOTSTRAP_ADMIN_PASSWORD'),
      }
    : null;
  if (demoUsers) {
    const emails = Object.values(demoUsers).map(({ email }) => email);
    if (new Set(emails).size !== emails.length) {
      throw new Error('Las cuentas de prueba deben tener emails diferentes');
    }
    if (emails.some((email) => !isEmail(email))) {
      throw new Error('Las cuentas de prueba deben tener emails válidos');
    }
    if (
      Object.values(demoUsers).some(
        ({ password }) => password.length < 12 || password.length > 72,
      )
    ) {
      throw new Error(
        'Las contraseñas de prueba deben tener entre 12 y 72 caracteres',
      );
    }
  }
  if (
    bootstrapAdmin &&
    (bootstrapAdmin.password.length < 12 || bootstrapAdmin.password.length > 72)
  ) {
    throw new Error(
      'BOOTSTRAP_ADMIN_PASSWORD debe tener entre 12 y 72 caracteres',
    );
  }
  if (bootstrapAdmin && !isEmail(bootstrapAdmin.email)) {
    throw new Error('BOOTSTRAP_ADMIN_EMAIL debe ser un email válido');
  }

  const hashes = demoUsers
    ? await Promise.all(
        Object.values(demoUsers).map(({ password }) =>
          passwordService.hash(password),
        ),
      )
    : [];
  const bootstrapAdminHash = bootstrapAdmin
    ? await passwordService.hash(bootstrapAdmin.password)
    : null;
  const turistaHash = await passwordService.hash(
    randomBytes(32).toString('hex'),
  );

  await prisma.$transaction(async (tx) => {
    for (const permiso of permisos) {
      await tx.permiso.upsert({
        where: { clave: permiso.clave },
        update: { descripcion: permiso.descripcion },
        create: permiso,
      });
    }

    for (const [nombre, claves] of Object.entries(roles)) {
      const rol = await tx.rol.upsert({
        where: { nombre },
        update: {},
        create: { nombre },
      });

      for (const clave of claves) {
        const permiso = await tx.permiso.findUniqueOrThrow({
          where: { clave },
          select: { id: true },
        });
        await tx.rolPermiso.upsert({
          where: {
            rolId_permisoId: { rolId: rol.id, permisoId: permiso.id },
          },
          update: {},
          create: { rolId: rol.id, permisoId: permiso.id },
        });
      }
    }

    const lugares = new Map<string, { id: number; nombre: string }>();
    for (const parada of paradas) {
      const { sucursales, nombreSucursal, direccion, ...datosLugar } = parada;
      const lugar = await tx.lugar.upsert({
        where: { nombre: datosLugar.nombre },
        update: {
          categoria: datosLugar.categoria,
          descripcion: datosLugar.descripcion,
        },
        create: datosLugar,
        select: { id: true, nombre: true },
      });
      lugares.set(lugar.nombre, lugar);
      const sucursalesIniciales = sucursales ?? [
        { nombre: nombreSucursal, direccion },
      ];
      for (const sucursal of sucursalesIniciales) {
        const sucursalExistente = await tx.sucursal.findFirst({
          where: { lugarId: lugar.id, nombre: sucursal.nombre },
          select: { id: true },
        });
        if (sucursalExistente) {
          await tx.sucursal.update({
            where: { id: sucursalExistente.id },
            data: { direccion: sucursal.direccion, activa: true },
          });
        } else {
          await tx.sucursal.create({
            data: {
              lugarId: lugar.id,
              nombre: sucursal.nombre,
              direccion: sucursal.direccion,
              codigoSello: randomBytes(24).toString('hex'),
            },
          });
        }
      }
    }

    const configurarRuta = async (datos: {
      nombre: string;
      descripcion: string;
      recompensa: { nombre: string; porcentaje: number; producto: string };
      lugares: string[];
      canjeEn: string[];
    }) => {
      const ruta = await tx.ruta.upsert({
        where: { nombre: datos.nombre },
        update: { descripcion: datos.descripcion, activa: true },
        create: { nombre: datos.nombre, descripcion: datos.descripcion },
        select: { id: true },
      });
      if (await tx.recorrido.count({ where: { rutaId: ruta.id } })) {
        return;
      }
      await tx.rutaLugar.deleteMany({ where: { rutaId: ruta.id } });
      await tx.rutaLugar.createMany({
        data: datos.lugares.map((nombre, index) => {
          const lugar = lugares.get(nombre);
          if (!lugar) {
            throw new Error(`No se encontró el lugar de seed "${nombre}"`);
          }
          return { rutaId: ruta.id, lugarId: lugar.id, orden: index + 1 };
        }),
      });
      const recompensa = await tx.recompensa.upsert({
        where: { rutaId: ruta.id },
        update: {
          nombre: datos.recompensa.nombre,
          porcentaje: datos.recompensa.porcentaje,
          producto: datos.recompensa.producto,
          diasVigencia: 30,
        },
        create: {
          rutaId: ruta.id,
          nombre: datos.recompensa.nombre,
          porcentaje: datos.recompensa.porcentaje,
          producto: datos.recompensa.producto,
          diasVigencia: 30,
        },
        select: { id: true },
      });
      await tx.recompensaLugar.deleteMany({
        where: { recompensaId: recompensa.id },
      });
      await tx.recompensaLugar.createMany({
        data: datos.canjeEn.map((nombre) => {
          const lugar = lugares.get(nombre);
          if (!lugar) {
            throw new Error(`No se encontró el lugar de seed "${nombre}"`);
          }
          return { recompensaId: recompensa.id, lugarId: lugar.id };
        }),
      });
    };

    await configurarRuta({
      nombre: 'Ruta de las salteñas',
      descripcion:
        'Un recorrido por cuatro lugares de salteñas tradicionales de Sucre.',
      recompensa: {
        nombre: 'Descuento en salteñas',
        porcentaje: 10,
        producto: 'Salteñas',
      },
      lugares: [
        'Patio San Alberto',
        'Regional',
        'Mary Salteñas',
        'Pato Salteñas',
      ],
      canjeEn: [
        'Patio San Alberto',
        'Regional',
        'Mary Salteñas',
        'Pato Salteñas',
      ],
    });
    await configurarRuta({
      nombre: 'Ruta del chocolate',
      descripcion: 'Un recorrido por chocolaterías y sabores de Sucre.',
      recompensa: {
        nombre: 'Descuento en submarino de chocolate',
        porcentaje: 15,
        producto: 'Submarino de chocolate',
      },
      lugares: ['Chocolates para ti', 'Taboada', 'Sucre', 'Wilbo'],
      canjeEn: ['Wilbo'],
    });

    const usuarioRole = await tx.rol.findUniqueOrThrow({
      where: { nombre: 'USUARIO' },
      select: { id: true },
    });
    await tx.usuario.upsert({
      where: { email: 'turista@rutero.test' },
      update: { passwordHash: turistaHash, rolId: usuarioRole.id },
      create: {
        email: 'turista@rutero.test',
        passwordHash: turistaHash,
        rolId: usuarioRole.id,
      },
    });

    if (demoUsers) {
      const roleIds = await Promise.all(
        ['ADMIN', 'LOCAL', 'USUARIO'].map(async (nombre) => {
          const role = await tx.rol.findUniqueOrThrow({
            where: { nombre },
            select: { id: true },
          });
          return role.id;
        }),
      );
      const admin = await tx.usuario.upsert({
        where: { id: 1 },
        update: {
          email: demoUsers.admin.email,
          passwordHash: hashes[0],
          rolId: roleIds[0],
        },
        create: {
          id: 1,
          email: demoUsers.admin.email,
          passwordHash: hashes[0],
          rolId: roleIds[0],
        },
        select: { id: true },
      });
      await tx.$queryRaw`
        SELECT setval(
          pg_get_serial_sequence('"Usuario"', 'id'),
          GREATEST((SELECT COALESCE(MAX("id"), 1) FROM "Usuario"), 1)
        )
      `;
      const local = await tx.usuario.upsert({
        where: { email: demoUsers.local.email },
        update: { passwordHash: hashes[1], rolId: roleIds[1] },
        create: {
          email: demoUsers.local.email,
          passwordHash: hashes[1],
          rolId: roleIds[1],
        },
        select: { id: true },
      });
      const turista = await tx.usuario.upsert({
        where: { email: demoUsers.usuario.email },
        update: { passwordHash: hashes[2], rolId: roleIds[2] },
        create: {
          email: demoUsers.usuario.email,
          passwordHash: hashes[2],
          rolId: roleIds[2],
        },
        select: { id: true },
      });

      const localAsignado = await tx.lugar.findFirst({
        where: { propietarioId: local.id },
        select: { id: true, nombre: true },
      });
      const lugarWilbo = lugares.get('Wilbo');
      if (!lugarWilbo) {
        throw new Error('No se encontró Wilbo en el seed');
      }
      const wilboActual = await tx.lugar.findUniqueOrThrow({
        where: { id: lugarWilbo.id },
        select: { propietarioId: true },
      });
      if (wilboActual.propietarioId && wilboActual.propietarioId !== local.id) {
        throw new Error('Wilbo ya está vinculado a otro usuario LOCAL');
      }
      if (localAsignado && localAsignado.id !== lugarWilbo.id) {
        await tx.lugar.update({
          where: { id: localAsignado.id },
          data: { propietarioId: null },
        });
      }
      await tx.lugar.update({
        where: { id: lugarWilbo.id },
        data: { propietarioId: local.id },
      });

      if (admin.id !== 1 || turista.id === local.id) {
        throw new Error(
          'Las cuentas de prueba no se pudieron crear correctamente',
        );
      }
    } else if (bootstrapAdmin && bootstrapAdminHash) {
      const adminRole = await tx.rol.findUniqueOrThrow({
        where: { nombre: 'ADMIN' },
        select: { id: true },
      });
      await tx.usuario.upsert({
        where: { id: 1 },
        update: {
          email: bootstrapAdmin.email,
          passwordHash: bootstrapAdminHash,
          rolId: adminRole.id,
        },
        create: {
          id: 1,
          email: bootstrapAdmin.email,
          passwordHash: bootstrapAdminHash,
          rolId: adminRole.id,
        },
      });
      await tx.$queryRaw`
        SELECT setval(
          pg_get_serial_sequence('"Usuario"', 'id'),
          GREATEST((SELECT COALESCE(MAX("id"), 1) FROM "Usuario"), 1)
        )
      `;
    }
  });
}

main()
  .catch((error: unknown) => {
    console.error('Error al ejecutar el seed de RUTERO:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
