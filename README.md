# RUTERO API


## Instalación local


   ```powershell
   if (-not (Test-Path .env)) { Copy-Item .env.example .env }
   ```

2. Genera un secreto JWT de 48 bytes:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
   ```

   Pega el resultado en `JWT_SECRET`. No compartas ni subas `.env`.

3. Instala dependencias e inicia PostgreSQL:

   ```powershell
   npm install
   docker compose up -d
   docker compose ps
   ```

   Espera a que el servicio `db` figure como `healthy`.

4. Aplica las migraciones, carga los datos de inicio y arranca la API:

   ```powershell
   npx prisma migrate dev
   npm run db:seed
   npm run start:dev
   ```


## Cuentas locales de prueba

Al ejecutar `npm run db:seed` fuera de producción se crean o actualizan estas
cuentas. Sus contraseñas son solo para desarrollo local; no las uses en
producción.

| Rol     | Email predeterminado   | Contraseña predeterminada     |
| ------- | ---------------------- | ----------------------------- |
| ADMIN   | `admin@rutero.local`   | `Admin123` |
| LOCAL   | `local@rutero.local`   | `Local123` |
| USUARIO | `usuario@rutero.local` | `User123`  |



## API

- Base URL: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/api/docs`

### Registro de cuentas

`POST /api/v1/auth/registro` acepta `email`, `password` y, opcionalmente,
`rol` con el valor `USUARIO` o `LOCAL`. Si se omite `rol`, se crea una cuenta
`USUARIO`. `ADMIN` no puede elegirse durante el registro público.

Las cuentas `LOCAL` se crean sin un lugar asignado. Un administrador debe
asociarlas después con `PATCH /api/v1/usuarios/{id}/rol` y `lugarId`.

## Prisma Studio


```powershell
npx prisma studio
```

Abre Prisma Studio en `http://localhost:5555`. ¿

## Migraciones en producción

Configura `DATABASE_URL` y `JWT_SECRET` en el entorno de producción y aplica
las migraciones versionadas con:

```powershell
npm prisma migrate deploy
npm run db:seed
```
