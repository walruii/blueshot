"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { InboxDirect, InboxGroup } from "@/types/chat";
import { Result } from "@/types/returnType";
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

export async function createDirectConversation(
  email: string,
): Promise<Result<string>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, error: "Unauthorized" };
    if (!email) return { success: false, error: "Email is required" };

    const { data: targetUser } = await supabaseAdmin
      .from("user")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!targetUser)
      return { success: false, error: "No user found with that email" };
    if (targetUser.id === session.user.id)
      return { success: false, error: "You cannot chat with yourself" };

    const { data: existing, error: findError } = await supabaseAdmin.rpc(
      "get_existing_direct_conversation",
      {
        user_a: session.user.id,
        user_b: targetUser.id,
      },
    );

    if (findError) console.error("Search error:", findError);
    if (existing) return { success: true, data: existing };

    const { data: conversation, error: convError } = await supabaseAdmin
      .from("conversation")
      .insert({ type: "direct" })
      .select()
      .single();

    if (convError) return { success: false, error: convError.message };

    const { error: partError } = await supabaseAdmin
      .from("conversation_participant")
      .insert([
        { conversation_id: conversation.id, user_id: session.user.id },
        { conversation_id: conversation.id, user_id: targetUser.id },
      ]);

    if (partError) return { success: false, error: partError.message };

    return { success: true, data: conversation.id };
  } catch (err) {
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getDirectConversationById(
  conversationId: string,
): Promise<InboxDirect | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return null;
    if (!conversationId) return null;

    const { data, error } = await supabaseAdmin
      .from("direct_messages_inbox")
      .select()
      .eq("current_user_id", session.user.id)
      .eq("id", conversationId)
      .maybeSingle();

    if (error) throw error;
    return data ?? null;
  } catch (err) {
    console.error("Error fetching direct conversation by id:", err);
    return null;
  }
}
