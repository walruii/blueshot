"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { InboxDirect, InboxGroup } from "@/types/chat";
import { headers } from "next/headers";

export async function getDirectConversations(): Promise<InboxDirect[]> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) return [];

    // Single trip to the database
    const { data, error } = await supabaseAdmin
      .from("direct_messages_inbox")
      .select()
      .eq("current_user_id", session.user.id)
      .order("last_message_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    // Transform to your expected type
    return data;
  } catch (err) {
    console.error("Error fetching direct conversations:", err);
    return [];
  }
}

export async function getGroupConversations(): Promise<InboxGroup[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) return [];

  const { data, error } = await supabaseAdmin
    .from("group_conversations_inbox")
    .select(
      `
      *,
      participants
    `,
    )
    .eq("current_user_id", session.user.id)
    .order("last_message_at", { ascending: false });

  if (error) {
    console.error("Error:", error);
    return [];
  }

  return data;
}
