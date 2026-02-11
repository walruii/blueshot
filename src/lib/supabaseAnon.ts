import { Database } from "@/types/database.types";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_LOCAL_SUPABASE_URL
    : process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseKey =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_LOCAL_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Database Could not connect");
}
export const supabaseAnon = createClient<Database>(supabaseUrl, supabaseKey);
