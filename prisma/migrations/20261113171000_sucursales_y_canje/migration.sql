-- Move branch-specific location data from Lugar into Sucursal.
CREATE TABLE "Sucursal" (
    "id" SERIAL NOT NULL,
    "lugarId" INTEGER NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "direccion" VARCHAR(150) NOT NULL,
    "codigoSello" VARCHAR(64) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Sucursal_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Sucursal" ("lugarId", "nombre", "direccion", "codigoSello")
SELECT "id", 'Sucursal principal', "direccion", "codigoSello"
FROM "Lugar";

ALTER TABLE "Lugar" ALTER COLUMN "descripcion" DROP NOT NULL;
ALTER TABLE "Lugar" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Sello" ADD COLUMN "sucursalId" INTEGER;

UPDATE "Sello" AS sello
SET "sucursalId" = sucursal."id"
FROM "Sucursal" AS sucursal
WHERE sucursal."lugarId" = sello."lugarId";

ALTER TABLE "Lugar" DROP COLUMN "direccion";
DROP INDEX "Lugar_codigoSello_key";
ALTER TABLE "Lugar" DROP COLUMN "codigoSello";

CREATE UNIQUE INDEX "Sucursal_codigoSello_key" ON "Sucursal"("codigoSello");
CREATE INDEX "Sucursal_lugarId_idx" ON "Sucursal"("lugarId");
CREATE INDEX "Sello_sucursalId_idx" ON "Sello"("sucursalId");
ALTER TABLE "Sucursal"
    ADD CONSTRAINT "Sucursal_lugarId_fkey"
    FOREIGN KEY ("lugarId") REFERENCES "Lugar"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Sello"
    ADD CONSTRAINT "Sello_sucursalId_fkey"
    FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Recompensa"
    ADD COLUMN "porcentaje" INTEGER NOT NULL DEFAULT 10,
    ADD COLUMN "producto" VARCHAR(160),
    ADD COLUMN "diasVigencia" INTEGER NOT NULL DEFAULT 30;

ALTER TABLE "Recompensa"
    ADD CONSTRAINT "Recompensa_porcentaje_valido"
    CHECK ("porcentaje" BETWEEN 1 AND 100);

CREATE TABLE "RecompensaLugar" (
    "recompensaId" INTEGER NOT NULL,
    "lugarId" INTEGER NOT NULL,
    CONSTRAINT "RecompensaLugar_pkey" PRIMARY KEY ("recompensaId", "lugarId")
);

INSERT INTO "RecompensaLugar" ("recompensaId", "lugarId")
SELECT recompensa."id", ruta_lugar."lugarId"
FROM "Recompensa" AS recompensa
JOIN "RutaLugar" AS ruta_lugar ON ruta_lugar."rutaId" = recompensa."rutaId";

ALTER TABLE "RecompensaLugar"
    ADD CONSTRAINT "RecompensaLugar_recompensaId_fkey"
    FOREIGN KEY ("recompensaId") REFERENCES "Recompensa"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecompensaLugar"
    ADD CONSTRAINT "RecompensaLugar_lugarId_fkey"
    FOREIGN KEY ("lugarId") REFERENCES "Lugar"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecompensaOtorgada"
    ADD COLUMN "codigoCanje" VARCHAR(64),
    ADD COLUMN "fechaOtorgada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN "fechaVencimiento" TIMESTAMP(3),
    ADD COLUMN "canjeada" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "fechaCanje" TIMESTAMP(3),
    ADD COLUMN "sucursalCanjeId" INTEGER;

UPDATE "RecompensaOtorgada" AS otorgada
SET
    "codigoCanje" = replace(gen_random_uuid()::text, '-', ''),
    "fechaVencimiento" = otorgada."fechaOtorgada"
        + make_interval(days => recompensa."diasVigencia"),
    "canjeada" = otorgada."entregada",
    "fechaCanje" = otorgada."fechaEntrega"
FROM "Recompensa" AS recompensa
WHERE recompensa."id" = otorgada."recompensaId";

ALTER TABLE "RecompensaOtorgada" ALTER COLUMN "codigoCanje" SET NOT NULL;
ALTER TABLE "RecompensaOtorgada" ALTER COLUMN "fechaVencimiento" SET NOT NULL;
ALTER TABLE "RecompensaOtorgada"
    ADD CONSTRAINT "RecompensaOtorgada_sucursalCanjeId_fkey"
    FOREIGN KEY ("sucursalCanjeId") REFERENCES "Sucursal"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "RecompensaOtorgada_codigoCanje_key"
    ON "RecompensaOtorgada"("codigoCanje");
CREATE INDEX "RecompensaOtorgada_sucursalCanjeId_idx"
    ON "RecompensaOtorgada"("sucursalCanjeId");

ALTER TABLE "RecompensaOtorgada" DROP COLUMN "entregada";
ALTER TABLE "RecompensaOtorgada" DROP COLUMN "fechaEntrega";

CREATE UNIQUE INDEX "Recorrido_usuarioId_rutaId_en_curso_key"
    ON "Recorrido"("usuarioId", "rutaId")
    WHERE "estado" = 'EN_CURSO';

UPDATE "Permiso"
SET "clave" = 'recompensas:canjear',
    "descripcion" = 'Canjear recompensas autorizadas'
WHERE "clave" = 'recompensas:entregar';
