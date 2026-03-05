"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { MessageWithSender } from "@/types/chat";
import type { Result } from "@/types/returnType";
import { headers } from "next/headers";

function mapRowToMessageWithSender(msg: {
  id: string;
  conversation_id: string | null;
  content: string;
  content_type: string | null;
  created_at: string;
  reply_to_id: string | null;
  deleted_at: string | null;
  meeting_id: string | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}): MessageWithSender {
  return {
    id: msg.id,
    conversation_id: msg.conversation_id ?? null,
    content: msg.content,
    content_type:
      (msg.content_type as MessageWithSender["content_type"]) ?? "text",
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
  };
}

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

  return messages.map(mapRowToMessageWithSender);
};

/** Fetches the most recent `limit` messages (newest first from DB), returns in ascending created_at order for display. */
export const getMessagesFirstPage = async (
  conversationId: string,
  limit: number = 20,
) => {
  let query = supabaseAdmin
    .from("message")
    .select("*, user!inner(id, name, email, image)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  const { data: messages, error } = await query;

  if (error) {
    console.error("Failed to fetch messages: ", error);
    return [];
  }

  const mapped = messages.map(mapRowToMessageWithSender);
  return mapped.reverse();
};

/** Fetches older messages before a given timestamp (cursor). Returns in ascending created_at order for prepending. */
export const getMessagesBefore = async (
  conversationId: string,
  beforeCreatedAt: string,
  limit: number = 20,
) => {
  let query = supabaseAdmin
    .from("message")
    .select("*, user!inner(id, name, email, image)")
    .eq("conversation_id", conversationId)
    .lt("created_at", beforeCreatedAt)
    .order("created_at", { ascending: false })
    .limit(limit);
  const { data: messages, error } = await query;

  if (error) {
    console.error("Failed to fetch older messages: ", error);
    return [];
  }

  const mapped = messages.map(mapRowToMessageWithSender);
  return mapped.reverse();
};

export const sendMessage = async (args: {
  conversationId: string;
  content: string;
  id: string;
  contentType?: MessageWithSender["content_type"];
}): Promise<Result<MessageWithSender>> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, error: "Unauthorized" };

    const content = args.content.trim();
    if (!args.conversationId) {
      return { success: false, error: "Conversation id is required" };
    }
    if (!content) return { success: false, error: "Message is empty" };
    if (!args.id) return { success: false, error: "Message id is required" };

    console.log("Attempting to send message with content:", args);
    const { data, error } = await supabaseAdmin
      .from("message")
      .insert({
        id: args.id,
        conversation_id: args.conversationId,
        content,
        content_type: args.contentType ?? "text",
        sender_id: session.user.id,
      })
      .select("*, user!inner(id, name, email, image)")
      .single();

    if (error || !data) {
      console.error("Failed to send message: ", error);
      return { success: false, error: error?.message ?? "Failed to send" };
    }

    // Broadcast realtime notification to other participants
    try {
      const { data: participants } = await supabaseAdmin
        .from("conversation_participant")
        .select("user_id")
        .eq("conversation_id", args.conversationId)
        .neq("user_id", session.user.id);

      if (participants && participants.length > 0) {
        await Promise.all(
          participants.map((p) =>
            supabaseAdmin.channel(`user_inbox_${p.user_id}`).send({
              type: "broadcast",
              event: "NEW_MESSAGE",
              payload: {
                conversationId: args.conversationId,
                senderName: session.user.name,
                preview: content.substring(0, 100),
              },
            }),
          ),
        );
      }
    } catch (broadcastErr) {
      console.error("Failed to broadcast new message", broadcastErr);
    }

    return { success: true, data: mapRowToMessageWithSender(data as any) };
  } catch (err) {
    console.error("Error in sendMessage: ", err);
    return { success: false, error: "An unexpected error occurred" };
  }
};

export async function fetchUserProfileAction(userId: string): Promise<
  Result<{
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  }>
> {
  try {
    const { data, error } = await supabaseAdmin
      .from("user")
      .select("id, name, email, image")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      return { success: false, error: "User not found" };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: "Internal server error" };
  }
}

/** Fetches the most recent `limit` messages (newest first from DB), returns in ascending created_at order for display. */
export const getMessagesMeeting = async (
  meetingId: string,
  limit: number = 20,
) => {
  let query = supabaseAdmin
    .from("message")
    .select("*, user!inner(id, name, email, image)")
    .eq("meeting_id", meetingId)
    .order("created_at", { ascending: false })
    .limit(limit);
  const { data: messages, error } = await query;

  if (error) {
    console.error("Failed to fetch messages: ", error);
    return [];
  }

  const mapped = messages.map(mapRowToMessageWithSender);
  return mapped.reverse();
};

/** Fetches older messages before a given timestamp (cursor). Returns in ascending created_at order for prepending. */
export const getMessagesBeforeMeeting = async (
  roomId: string,
  beforeCreatedAt: string,
  limit: number = 20,
) => {
  let query = supabaseAdmin
    .from("message")
    .select("*, user!inner(id, name, email, image), meeting!inner(id, room_id)")
    .eq("meeting.room_id", roomId)
    .lt("created_at", beforeCreatedAt)
    .order("created_at", { ascending: false })
    .limit(limit);
  const { data: messages, error } = await query;

  if (error) {
    console.error("Failed to fetch older messages: ", error);
    return [];
  }

  const mapped = messages.map(mapRowToMessageWithSender);
  return mapped.reverse();
};

export const sendMessageMeeting = async (args: {
  meetingId: string;
  content: string;
  id: string;
  contentType?: MessageWithSender["content_type"];
}): Promise<Result<MessageWithSender>> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, error: "Unauthorized" };

    const content = args.content.trim();
    if (!args.meetingId) {
      return { success: false, error: "Meeting id is required" };
    }
    if (!content) return { success: false, error: "Message is empty" };
    if (!args.id) return { success: false, error: "Message id is required" };

    console.log("Attempting to send message with content:", args);
    const { data, error } = await supabaseAdmin
      .from("message")
      .insert({
        id: args.id,
        meeting_id: args.meetingId,
        content,
        content_type: args.contentType ?? "text",
        sender_id: session.user.id,
      })
      .select("*, user!inner(id, name, email, image)")
      .single();

    if (error || !data) {
      console.error("Failed to send message: ", error);
      return { success: false, error: error?.message ?? "Failed to send" };
    }

    return { success: true, data: mapRowToMessageWithSender(data as any) };
  } catch (err) {
    console.error("Error in sendMessage: ", err);
    return { success: false, error: "An unexpected error occurred" };
  }
};
