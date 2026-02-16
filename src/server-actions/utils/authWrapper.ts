"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Result } from "@/types/returnType";
import { Session } from "@/types/sessionType";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Get the current session or return an error result
 */
export async function getSessionOrError(): Promise<
  Result<Session> & { session?: Session }
> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { success: false, error: "Invalid session" };
  }

  return { success: true, data: session, session };
}

/**
 * Wrapper for server actions that require authentication
 * Handles session validation and provides typed session to the action
 */
export async function withAuthSession<T>(
  fn: (session: Session) => Promise<Result<T>>,
): Promise<Result<T>> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { success: false, error: "Invalid session" };
  }

  return fn(session);
}

/**
 * Verify that the current user owns a resource
 * Returns the resource if ownership is verified, error otherwise
 */
export async function verifyOwnership<T>(
  table: "event" | "event_group" | "user_group",
  resourceId: string,
  userId: string,
  ownerColumn: string = "created_by",
): Promise<Result<T>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabaseAdmin as any)
    .from(table)
    .select("*")
    .eq("id", resourceId)
    .eq(ownerColumn, userId)
    .single();

  if (error || !data) {
    return { success: false, error: `${table} not found or access denied` };
  }

  return { success: true, data: data as T };
}
