import { PrismaClient } from "@prisma/client";

// Direct connection that bypasses PgBouncer — required for serializable transactions
const g = globalThis as unknown as { _prismairect?: PrismaClient };

export const prismairect =
  g._prismairect ??
  new PrismaClient({
    datasources: { db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL } },
  });

if (process.env.NODE_ENV !== "production") g._prismairect = prismairect;
