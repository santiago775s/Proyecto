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


| Rol     | Email predeterminado   | Contraseña predeterminada     |
| ------- | ---------------------- | ----------------------------- |
| ADMIN   | `admin@rutero.local`   | `ChangeThisAdminPassword123!` |
| LOCAL   | `local@rutero.local`   | `ChangeThisLocalPassword123!` |
| USUARIO | `usuario@rutero.local` | `ChangeThisUserPassword123!`  |



## API

- Base URL: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/api/docs`

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
