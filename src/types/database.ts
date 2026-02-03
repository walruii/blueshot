import type { Database as SupabaseDatabase } from "../supabase/generated/types/file";
import type { KyselifyDatabase } from "kysely-supabase";

export type Database = KyselifyDatabase<SupabaseDatabase>;
