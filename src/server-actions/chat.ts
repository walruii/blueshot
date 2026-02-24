"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const getMessages = async (conversationId: string) => {
  const { data: messages, error } = await supabaseAdmin
    .from("message")
    .select("*, user!inner(id, name, email, image)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch messages: ", error);
    return [];
  }

  return messages.map((msg) => ({
    id: msg.id,
    conversation_id: msg.conversation_id,
    content: msg.content,
    content_type: msg.content_type,
    created_at: msg.created_at,
    reply_to_id: msg.reply_to_id,
    deleted_at: msg.deleted_at,
    meeting_id: msg.meeting_id,
    sender: {
      id: msg.user.id,
      name: msg.user.name,
      email: msg.user.email,
      image: msg.user.image,
    },
  }));
};
