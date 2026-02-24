import { useEffect } from "react";
import { supabaseAnon } from "@/lib/supabaseAnon";
import { useChatStore } from "@/stores/chatStore";
import { MessageWithSender } from "@/types/chat";

const defaultContentType: MessageWithSender["content_type"] = "text";

// helper that will take a raw message row from Supabase and convert to
// our MessageWithSender shape. Because realtime payloads don't include
// the joined user details, we optionally fetch the sender after the fact.
async function hydrateMessage(row: any): Promise<MessageWithSender> {
  // if row contains explicit sender fields, use them directly
  if (row.user_name || row.user_email || row.user_image) {
    return {
      id: row.id,
      conversation_id: row.conversation_id,
      content: row.content,
      content_type: (row.content_type ?? defaultContentType) as MessageWithSender["content_type"],
      created_at: row.created_at,
      reply_to_id: row.reply_to_id,
      deleted_at: row.deleted_at,
      meeting_id: row.meeting_id,
      sender: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email,
        image: row.user_image,
      },
    };
  }

  // otherwise fetch the message again with user join
  const { data, error } = await supabaseAnon
    .from("message")
    .select("*, user!inner(id, name, email, image)")
    .eq("id", row.id)
    .single();
  if (error || !data) {
    console.error("Failed to hydrate realtime message", error);
    // fall back to minimal representation
    return {
      id: row.id,
      conversation_id: row.conversation_id,
      content: row.content,
      content_type: (row.content_type ?? defaultContentType) as MessageWithSender["content_type"],
      created_at: row.created_at,
      reply_to_id: row.reply_to_id,
      deleted_at: row.deleted_at,
      meeting_id: row.meeting_id,
      sender: { id: row.user_id, name: null, email: null, image: null },
    };
  }
  return {
    id: data.id,
    conversation_id: data.conversation_id,
    content: data.content,
    content_type: (data.content_type ?? defaultContentType) as MessageWithSender["content_type"],
    created_at: data.created_at,
    reply_to_id: data.reply_to_id,
    deleted_at: data.deleted_at,
    meeting_id: data.meeting_id,
    sender: {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      image: data.user.image,
    },
  };
}

export function useRealtimeChat(convoId: string) {
  useEffect(() => {
    if (!convoId) return;
    // make sure the store has a slot for this convo before any incoming messages
    useChatStore.getState().initializeConversation(convoId);

    const channel = supabaseAnon
      .channel(`public:message:conversation_id=eq.${convoId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message",
          filter: `conversation_id=eq.${convoId}`,
        },
        async (payload) => {
          const msg = await hydrateMessage(payload.new);
          // Use upsert so optimistic messages (same id) get reconciled.
          useChatStore.getState().upsertMessage(convoId, msg);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "message",
          filter: `conversation_id=eq.${convoId}`,
        },
        async (payload) => {
          const msg = await hydrateMessage(payload.new);
          useChatStore.getState().upsertMessage(convoId, msg);
        },
      )
      .subscribe();

    return () => {
      supabaseAnon.removeChannel(channel);
    };
  }, [convoId]);
}
