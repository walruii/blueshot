import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";

export const db = new Kysely<PostgresDialect>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL, // This must point to 54322
    }),
  }),
});
