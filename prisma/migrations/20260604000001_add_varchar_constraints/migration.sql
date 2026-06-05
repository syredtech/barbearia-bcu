-- Truncate existing data that exceeds new VARCHAR limits
UPDATE "User" SET "name" = LEFT("name", 100) WHERE length("name") > 100;
UPDATE "User" SET "email" = LEFT("email", 254) WHERE length("email") > 254;
UPDATE "Venue" SET "name" = LEFT("name", 100) WHERE length("name") > 100;
UPDATE "Venue" SET "description" = LEFT("description", 500) WHERE length("description") > 500;
UPDATE "Funcionario" SET "name" = LEFT("name", 100) WHERE length("name") > 100;
UPDATE "Servico" SET "name" = LEFT("name", 100) WHERE length("name") > 100;
UPDATE "Servico" SET "description" = LEFT("description", 500) WHERE length("description") > 500;
UPDATE "Notificacao" SET "body" = LEFT("body", 500) WHERE length("body") > 500;

-- Add VARCHAR constraints
ALTER TABLE "User" ALTER COLUMN "name" TYPE VARCHAR(100);
ALTER TABLE "User" ALTER COLUMN "email" TYPE VARCHAR(254);
ALTER TABLE "Venue" ALTER COLUMN "name" TYPE VARCHAR(100);
ALTER TABLE "Venue" ALTER COLUMN "description" TYPE VARCHAR(500);
ALTER TABLE "Funcionario" ALTER COLUMN "name" TYPE VARCHAR(100);
ALTER TABLE "Servico" ALTER COLUMN "name" TYPE VARCHAR(100);
ALTER TABLE "Servico" ALTER COLUMN "description" TYPE VARCHAR(500);
ALTER TABLE "Notificacao" ALTER COLUMN "title" TYPE VARCHAR(200);
ALTER TABLE "Notificacao" ALTER COLUMN "body" TYPE VARCHAR(500);

