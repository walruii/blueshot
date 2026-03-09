import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseToken } from "./supabase-token";

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
let supabase: SupabaseClient | null = null;

export const getSupabaseAnonClient = async () => {
  if (supabase) {
    return supabase;
  }

  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false, // Recommended when using external Auth like Better Auth
    },
    global: {
      fetch: (url, options) => fetch(url, { ...options, credentials: "omit" }),
    },
    accessToken: async () => {
      const token = await getSupabaseToken();
      return token ?? "";
    },
  });

  return supabase;
};
