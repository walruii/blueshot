import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.LOCAL_SUPABASE_URL
    : process.env.SUPABASE_URL;
const supabaseKey =
  process.env.NODE_ENV === "development"
    ? process.env.LOCAL_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    : process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Database Could not connect");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
