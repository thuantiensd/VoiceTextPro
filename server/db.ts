import 'dotenv/config';
console.log("✅ DATABASE_URL:", process.env.DATABASE_URL);
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const databaseUrl = process.env.DATABASE_URL || "postgresql://tienthuan@localhost:5432/voicetextpro";
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });
