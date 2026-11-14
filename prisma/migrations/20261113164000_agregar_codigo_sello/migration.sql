-- AlterTable
ALTER TABLE "Lugar" ADD COLUMN "codigoSello" VARCHAR(64);

-- Backfill old places before making the code mandatory.
UPDATE "Lugar"
SET "codigoSello" = replace(gen_random_uuid()::text, '-', '')
WHERE "codigoSello" IS NULL;

ALTER TABLE "Lugar" ALTER COLUMN "codigoSello" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Lugar_codigoSello_key" ON "Lugar"("codigoSello");
