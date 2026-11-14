-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- Reserve the provisional user id used by phase 2 without creating a usable account.
INSERT INTO "Usuario" ("id", "email", "passwordHash", "createdAt")
VALUES (
    1,
    'legacy-seed@rutero.invalid',
    'scrypt$00000000000000000000000000000000$00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

SELECT setval(
    pg_get_serial_sequence('"Usuario"', 'id'),
    GREATEST((SELECT COALESCE(MAX("id"), 1) FROM "Usuario"), 1),
    true
);
