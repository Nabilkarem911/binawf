import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Lazy singleton: importing this module must NEVER construct the client.
// Next.js imports route handlers / server modules at BUILD time to collect
// page data — with no DATABASE_URL in the build env, constructing eagerly at
// module scope crashes the build ("DATABASE_URL is not set"). The client is
// created on first property access (i.e. first real query at runtime).
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const connectionString = process.env["DATABASE_URL"];
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    globalForPrisma.prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString }),
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }
  return globalForPrisma.prisma;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return Reflect.get(getClient(), prop);
  },
});
