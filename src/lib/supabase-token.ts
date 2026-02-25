"use server";
// lib/supabase-token.ts (Server Action or Route)
import { SignJWT } from "jose";
import { headers } from "next/headers";
import { auth } from "./auth";

export async function getSupabaseToken() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    throw new Error("No valid session");
  }

  const userId = session.user.id;

  const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);

  // This payload is exactly what Supabase expects for auth.uid() to work
  const token = await new SignJWT({
    aud: "authenticated",
    role: "authenticated",
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
  })
    .setProtectedHeader({ alg: "HS256" })
    .sign(secret);
  console.log(token);
  return token;
}
