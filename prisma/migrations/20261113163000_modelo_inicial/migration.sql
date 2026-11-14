-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CategoriaLugar" AS ENUM ('TIPICA', 'RAPIDA');

-- CreateEnum
CREATE TYPE "EstadoRecorrido" AS ENUM ('EN_CURSO', 'COMPLETADO');

-- CreateTable
CREATE TABLE "Lugar" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "categoria" "CategoriaLugar" NOT NULL,
    "direccion" VARCHAR(150) NOT NULL,
    "descripcion" VARCHAR(250) NOT NULL,

    CONSTRAINT "Lugar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ruta" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(500) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Ruta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RutaLugar" (
    "id" SERIAL NOT NULL,
    "rutaId" INTEGER NOT NULL,
    "lugarId" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "RutaLugar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recompensa" (
    "id" SERIAL NOT NULL,
    "rutaId" INTEGER NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,

    CONSTRAINT "Recompensa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recorrido" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "rutaId" INTEGER NOT NULL,
    "estado" "EstadoRecorrido" NOT NULL DEFAULT 'EN_CURSO',
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),

    CONSTRAINT "Recorrido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sello" (
    "id" SERIAL NOT NULL,
    "recorridoId" INTEGER NOT NULL,
    "lugarId" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sello_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecompensaOtorgada" (
    "id" SERIAL NOT NULL,
    "recorridoId" INTEGER NOT NULL,
    "recompensaId" INTEGER NOT NULL,
    "entregada" BOOLEAN NOT NULL DEFAULT false,
    "fechaEntrega" TIMESTAMP(3),

    CONSTRAINT "RecompensaOtorgada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lugar_nombre_key" ON "Lugar"("nombre");

-- CreateIndex
CREATE INDEX "Lugar_categoria_idx" ON "Lugar"("categoria");

-- CreateIndex
CREATE UNIQUE INDEX "Ruta_nombre_key" ON "Ruta"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "RutaLugar_rutaId_orden_key" ON "RutaLugar"("rutaId", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "RutaLugar_rutaId_lugarId_key" ON "RutaLugar"("rutaId", "lugarId");

-- CreateIndex
CREATE UNIQUE INDEX "Recompensa_rutaId_key" ON "Recompensa"("rutaId");

-- CreateIndex
CREATE INDEX "Recorrido_usuarioId_rutaId_estado_idx" ON "Recorrido"("usuarioId", "rutaId", "estado");

-- CreateIndex
CREATE INDEX "Sello_lugarId_fecha_idx" ON "Sello"("lugarId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Sello_recorridoId_lugarId_key" ON "Sello"("recorridoId", "lugarId");

-- CreateIndex
CREATE UNIQUE INDEX "Sello_recorridoId_orden_key" ON "Sello"("recorridoId", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "RecompensaOtorgada_recorridoId_key" ON "RecompensaOtorgada"("recorridoId");

-- AddForeignKey
ALTER TABLE "RutaLugar" ADD CONSTRAINT "RutaLugar_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "Ruta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RutaLugar" ADD CONSTRAINT "RutaLugar_lugarId_fkey" FOREIGN KEY ("lugarId") REFERENCES "Lugar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recompensa" ADD CONSTRAINT "Recompensa_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "Ruta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recorrido" ADD CONSTRAINT "Recorrido_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "Ruta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sello" ADD CONSTRAINT "Sello_recorridoId_fkey" FOREIGN KEY ("recorridoId") REFERENCES "Recorrido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sello" ADD CONSTRAINT "Sello_lugarId_fkey" FOREIGN KEY ("lugarId") REFERENCES "Lugar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecompensaOtorgada" ADD CONSTRAINT "RecompensaOtorgada_recorridoId_fkey" FOREIGN KEY ("recorridoId") REFERENCES "Recorrido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecompensaOtorgada" ADD CONSTRAINT "RecompensaOtorgada_recompensaId_fkey" FOREIGN KEY ("recompensaId") REFERENCES "Recompensa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
