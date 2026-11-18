CREATE TABLE "ValoracionLugar" (
    "usuarioId" INTEGER NOT NULL,
    "lugarId" INTEGER NOT NULL,
    "estrellas" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ValoracionLugar_pkey" PRIMARY KEY ("usuarioId", "lugarId"),
    CONSTRAINT "ValoracionLugar_estrellas_valido" CHECK ("estrellas" BETWEEN 1 AND 5)
);

CREATE INDEX "ValoracionLugar_lugarId_idx" ON "ValoracionLugar"("lugarId");

ALTER TABLE "ValoracionLugar"
    ADD CONSTRAINT "ValoracionLugar_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ValoracionLugar"
    ADD CONSTRAINT "ValoracionLugar_lugarId_fkey"
    FOREIGN KEY ("lugarId") REFERENCES "Lugar"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
