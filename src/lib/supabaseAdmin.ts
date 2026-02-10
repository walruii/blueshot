import { Database } from "@/types/database.types";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_LOCAL_SUPABASE_URL
    : process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAdminKey =
  process.env.NODE_ENV === "development"
    ? process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY
    : process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAdminKey) {
  throw new Error("Database Could not connect");
}

export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseAdminKey,
);
