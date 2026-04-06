import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function reset() {
  console.log("Resetting database...");
  await db.execute(sql`DROP SCHEMA public CASCADE`);
  await db.execute(sql`CREATE SCHEMA public`);
  console.log("Database reset complete. Run db:migrate and db:seed to re-initialize.");
  await pool.end();
}

reset().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
