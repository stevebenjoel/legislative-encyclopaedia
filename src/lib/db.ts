import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { serverEnv } from "@/config/env";

const globalForPrisma = globalThis as unknown as { legiscorePrisma?: PrismaClient };

export function getDatabase() {
  if (!serverEnv.databaseUrl) {
    throw new Error("DATABASE_URL is required for database operations.");
  }

  if (!globalForPrisma.legiscorePrisma) {
    const adapter = new PrismaPg({ connectionString: serverEnv.databaseUrl });
    globalForPrisma.legiscorePrisma = new PrismaClient({ adapter });
  }

  return globalForPrisma.legiscorePrisma;
}
