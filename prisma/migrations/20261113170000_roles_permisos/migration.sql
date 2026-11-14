-- AlterTable
ALTER TABLE "Lugar" ADD COLUMN     "propietarioId" INTEGER;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "rolId" INTEGER;

-- CreateTable
CREATE TABLE "Rol" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(40) NOT NULL,

    CONSTRAINT "Rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permiso" (
    "id" SERIAL NOT NULL,
    "clave" VARCHAR(80) NOT NULL,
    "descripcion" VARCHAR(200) NOT NULL,

    CONSTRAINT "Permiso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolPermiso" (
    "rolId" INTEGER NOT NULL,
    "permisoId" INTEGER NOT NULL,

    CONSTRAINT "RolPermiso_pkey" PRIMARY KEY ("rolId","permisoId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rol_nombre_key" ON "Rol"("nombre");

INSERT INTO "Rol" ("nombre")
VALUES ('USUARIO')
ON CONFLICT ("nombre") DO NOTHING;

UPDATE "Usuario"
SET "rolId" = (SELECT "id" FROM "Rol" WHERE "nombre" = 'USUARIO')
WHERE "rolId" IS NULL;

ALTER TABLE "Usuario" ALTER COLUMN "rolId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Permiso_clave_key" ON "Permiso"("clave");

-- CreateIndex
CREATE INDEX "RolPermiso_permisoId_idx" ON "RolPermiso"("permisoId");

-- CreateIndex
CREATE UNIQUE INDEX "Lugar_propietarioId_key" ON "Lugar"("propietarioId");

-- CreateIndex
CREATE INDEX "Recorrido_rutaId_estado_idx" ON "Recorrido"("rutaId", "estado");

-- AddForeignKey
ALTER TABLE "Lugar" ADD CONSTRAINT "Lugar_propietarioId_fkey" FOREIGN KEY ("propietarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recorrido" ADD CONSTRAINT "Recorrido_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolPermiso" ADD CONSTRAINT "RolPermiso_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolPermiso" ADD CONSTRAINT "RolPermiso_permisoId_fkey" FOREIGN KEY ("permisoId") REFERENCES "Permiso"("id") ON DELETE CASCADE ON UPDATE CASCADE;
