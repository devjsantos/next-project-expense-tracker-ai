import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const prismaClientSingleton = () => {
  // 1. Create a connection pool using your env variable
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  // 2. Initialize the Prisma adapter
  const adapter = new PrismaPg(pool);

  // 3. Pass the adapter to the client
  return new PrismaClient({ adapter });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const db = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}