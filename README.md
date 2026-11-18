# RUTERO API

API REST de rutas gastronómicas y sellos de fidelidad en Sucre. Está construida
con NestJS, TypeScript, PostgreSQL y Prisma.

## Requisitos

- Node.js y npm
- Docker con Docker Compose

## Instalación y ejecución local

1. Crea el archivo de entorno a partir de la plantilla:

   ```powershell
   if (-not (Test-Path .env)) { Copy-Item .env.example .env }
   ```

2. Genera un secreto JWT de 48 bytes:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
   ```

   Pega el resultado en `JWT_SECRET`. No compartas ni subas `.env`.

3. Instala las dependencias e inicia el contenedor de PostgreSQL:

   ```powershell
   npm install
   docker compose up -d
   docker compose ps
   ```

   Espera a que el servicio `db` figure como `healthy`.

4. Aplica las migraciones, carga los datos de inicio y arranca la API:

   ```powershell
   npm run db:migrate
   npm run db:seed
   npm run start:dev
   ```

   La API queda disponible en `http://localhost:3000/api/v1`; Swagger está en
   `http://localhost:3000/api/docs`.

## Configuración

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto HTTP; predeterminado: `3000`. |
| `DATABASE_URL` | Cadena de conexión PostgreSQL; en desarrollo coincide con `.env.example`. |
| `JWT_SECRET` | Secreto requerido para firmar y verificar tokens. |
| `CORS_ORIGINS` | Orígenes web permitidos separados por comas; predeterminado: `http://localhost:5173`. |

El `docker-compose.yml` publica PostgreSQL en el puerto `5433` de la máquina.
Modifica `DATABASE_URL` si cambias la configuración de la base.

## Cuentas locales de prueba

Al ejecutar `npm run db:seed` fuera de producción se crean o actualizan estas
cuentas de desarrollo:

| Rol     | Email predeterminado   | Contraseña predeterminada     |
| ------- | ---------------------- | ----------------------------- |
| ADMIN   | `admin@rutero.local`   | `Admin1234567` |
| LOCAL   | `local@rutero.local`   | `Local1234567` |
| USUARIO | `usuario@rutero.local` | `User12345678` |

Si ya ejecutaste el seed, vuelve a ejecutar `npm run db:seed` para actualizar
las contraseñas de estas cuentas. Las contraseñas configuradas mediante
variables de entorno deben tener entre 12 y 72 caracteres.

Son credenciales solo para desarrollo local; no las uses en producción. El
registro público permite crear cuentas `USUARIO` o `LOCAL`, pero nunca elegir
`ADMIN`. Una cuenta `LOCAL` comienza sin lugar asignado; un administrador debe
asociarla con `PATCH /api/v1/usuarios/{id}/rol`.

## API y Swagger

- URL base: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api/docs`
- Estado de la API: `GET /api/v1`

La aplicación obtiene las rutas de los controladores NestJS en `src/`. El
prefijo `/api` y la versión URI `/v1` se configuran en
`src/configurar-aplicacion.ts`; los módulos de cada área se registran en
`src/app.module.ts`.

### Endpoints

Las rutas con `:id` o `:rutaId` esperan un identificador entero en la URL. Los
endpoints protegidos requieren `Authorization: Bearer <token>` y, cuando se
indica, el permiso correspondiente al rol.

| Método y ruta | Descripción | Acceso |
| --- | --- | --- |
| `POST /auth/registro` | Crear cuenta `USUARIO` o `LOCAL`. | Público |
| `POST /auth/login` | Iniciar sesión y obtener JWT. | Público |
| `GET /lugares` | Listar lugares; admite `categoria`, `orden`, `page` y `limit`. | JWT + `lugares:leer` |
| `GET /lugares/estadisticas` | Conteos agregados de lugares; admite `desde` y `hasta`. | JWT + `estadisticas:todas` |
| `GET /lugares/:id` | Consultar un lugar. | JWT + `lugares:leer` |
| `POST /lugares/:id/valoraciones` | Crear o actualizar una valoración de 1 a 5 estrellas. | JWT + `lugares:valorar` |
| `POST /lugares` | Crear un lugar. | JWT + `lugares:administrar` |
| `PUT /lugares/:id` | Reemplazar los datos de un lugar. | JWT + `lugares:administrar` |
| `PATCH /lugares/:id` | Actualizar parcialmente un lugar. | JWT + `lugares:administrar` |
| `DELETE /lugares/:id` | Eliminar un lugar. | JWT + `lugares:administrar` |
| `POST /lugares/:id/codigo/rotar` | Rotar el código de sello. | JWT + `sellos:codigo` |
| `GET /rutas` | Listar rutas activas con paradas y recompensa. | JWT + `lugares:leer` |
| `GET /rutas/:id` | Consultar una ruta activa. | JWT + `lugares:leer` |
| `POST /rutas` | Crear una ruta. | JWT + `rutas:administrar` |
| `PATCH /rutas/:id` | Actualizar una ruta. | JWT + `rutas:administrar` |
| `DELETE /rutas/:id` | Eliminar una ruta. | JWT + `rutas:administrar` |
| `PUT /rutas/:id/paradas` | Reemplazar las paradas ordenadas de una ruta. | JWT + `rutas:administrar` |
| `POST /rutas/:id/recompensa` | Crear la recompensa de una ruta. | JWT + `rutas:administrar` |
| `POST /rutas/:rutaId/recorridos` | Iniciar un recorrido demo de una ruta. | Sin guard explícito; sujeto al límite global |
| `GET /recorridos/me` | Listar los recorridos propios. | JWT + `recorridos:propios` |
| `GET /recorridos/:id` | Consultar un recorrido propio. | JWT + `recorridos:propios` |
| `POST /recorridos/:id/sellos` | Sellar la siguiente parada en el flujo demo. | Sin guard explícito; sujeto a límite de solicitudes |
| `GET /recompensas/me` | Listar las recompensas propias. | JWT + `recorridos:propios` |
| `PATCH /recompensas/:id/entregar` | Canjear una recompensa autorizada. | JWT + `recompensas:canjear` |
| `GET /locales/me/recompensas/pendientes` | Listar recompensas pendientes del local. | JWT + `recompensas:canjear` |
| `GET /locales/me/estadisticas` | Consultar estadísticas del local asignado. | JWT + `estadisticas:propias` |
| `PATCH /usuarios/:id/rol` | Asignar rol y local a un usuario. | JWT + `usuarios:roles` |

Los endpoints de inicio de recorrido demo y sellado no tienen un guard JWT o de
permisos declarado en sus controladores; sí están sujetos al limitador global.
El endpoint de sellado además declara un límite específico. Si cambia ese
comportamiento, actualiza también esta tabla.

### Ejemplos

Login:

```http
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "usuario@rutero.local", "password": "User12345678" }
```

La respuesta contiene `access_token`, `token_type` (`Bearer`) y `expires_in`
(segundos). Envía el token en el encabezado `Authorization` para endpoints
protegidos.

Valorar un lugar:

```http
POST /api/v1/lugares/1/valoraciones
Authorization: Bearer <token>
Content-Type: application/json

{ "estrellas": 5 }
```

Cada usuario tiene una valoración por lugar; volver a enviar la solicitud
actualiza su puntuación. Las consultas de lugares incluyen `promedioValoracion`
y `cantidadValoraciones`; sin valoraciones, esos campos son `null` y `0`.

## Arquitectura del proyecto

| Ruta | Responsabilidad |
| --- | --- |
| `src/main.ts` | Arranque de NestJS y escucha del puerto. |
| `src/configurar-aplicacion.ts` | CORS, validación, prefijo/versionado, filtro Prisma y Swagger. |
| `src/app.module.ts` | Módulo raíz y módulos de dominio. |
| `src/*/*.controller.ts` | Rutas HTTP y metadatos de Swagger. |
| `src/*/*.service.ts` | Lógica de negocio y acceso a Prisma. |
| `src/*/dto/` | Contratos y validación de cuerpos y parámetros. |
| `src/auth/` | Registro, login, JWT y usuario autenticado. |
| `src/autorizacion/` | Permisos, decorador y guard de autorización. |
| `src/prisma/` | Cliente Prisma conectado a PostgreSQL. |
| `prisma/schema.prisma` | Modelos, enums y relaciones de la base de datos. |
| `prisma/migrations/` | Historial versionado de cambios del esquema. |

Nest combina `@Controller('lugares')` con decoradores como `@Get(':id')` y la
configuración global, para producir `/api/v1/lugares/:id`. Swagger se genera a
partir de los metadatos `@ApiTags`, `@ApiOperation`, `@ApiParam`, `@ApiQuery`,
`@ApiBearerAuth` y los `@ApiProperty` de los DTO.

La validación global transforma los valores de entrada, descarta campos
desconocidos y rechaza solicitudes que incluyan propiedades no permitidas.
Los DTO declaran las reglas con `class-validator` y, cuando hace falta,
convierten valores con `class-transformer`.

La autenticación usa JWT Bearer. `JwtAuthGuard` valida el token y pone el
usuario autenticado en la solicitud; `PermissionsGuard` comprueba en la base de
datos los permisos asociados al rol. El seed asigna permisos a los roles
`USUARIO`, `LOCAL` y `ADMIN`.

## Base de datos

PostgreSQL almacena usuarios y roles, lugares y sucursales, rutas y paradas,
recorridos y sellos, valoraciones, y recompensas con sus canjes. El esquema y
las relaciones están declarados en `prisma/schema.prisma`.

Para abrir Prisma Studio:

```powershell
npm exec -- prisma studio
```

Se abre normalmente en `http://localhost:5555`.

## Migraciones en producción

Configura `DATABASE_URL` y `JWT_SECRET` en el entorno de producción y aplica
las migraciones versionadas con:

```powershell
npm exec -- prisma migrate deploy
```

El seed de producción no habilita cuentas demo. Para crear el administrador
inicial, configura `BOOTSTRAP_ADMIN_EMAIL` y `BOOTSTRAP_ADMIN_PASSWORD` antes de
ejecutar `npm run db:seed`.
