import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { Database } from "@/types/database";

export const kysely = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
    }),
  }),
});
