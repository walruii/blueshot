"use server";

import "server-only";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { headers } from "next/headers";
import type {
  Conversation,
  ConversationWithMetadata,
  Message,
  MessageWithSender,
} from "@/types/chat";

type ConversationUpdate = {
  name?: string;
  description?: string;
  avatar_url?: string;
};

type ActionResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
    };

async function getSessionUserId(): Promise<ActionResult<string>> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return { success: false, error: "Invalid session" };
  }

  return { success: true, data: session.user.id };
}

async function checkConversationAccess(
  userId: string,
  conversationId: string,
): Promise<ActionResult<boolean>> {
  const { data, error } = await supabaseAdmin.rpc("check_conversation_access", {
    p_user_id: userId,
    p_conversation_id: conversationId,
  });

  if (error) {
    console.error("Error checking conversation access:", error);
    return { success: false, error: "Failed to check access" };
  }

  return { success: true, data: Boolean(data) };
}

async function buildConversationWithMetadata(
  conversation: Conversation,
  userId: string,
): Promise<ConversationWithMetadata> {
  const [
    messageCountResult,
    participantCountResult,
    lastMessageResult,
    participantResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conversation.id)
      .is("deleted_at", null),
    supabaseAdmin
      .from("conversation_participants")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conversation.id),
    supabaseAdmin
      .from("messages")
      .select("content")
      .eq("conversation_id", conversation.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("conversation_participants")
      .select("last_seen_at, muted_until")
      .eq("conversation_id", conversation.id)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (messageCountResult.error) {
    console.error("Error fetching message count:", messageCountResult.error);
  }

  if (participantCountResult.error) {
    console.error(
      "Error fetching participant count:",
      participantCountResult.error,
    );
  }

  if (lastMessageResult.error) {
    console.error("Error fetching last message:", lastMessageResult.error);
  }

  if (participantResult.error) {
    console.error("Error fetching participant state:", participantResult.error);
  }

  const messageCount = messageCountResult.count ?? 0;
  const participantCount = participantCountResult.count ?? 0;
  const lastMessagePreview = lastMessageResult.data?.content ?? undefined;
  const lastSeenAt = participantResult.data?.last_seen_at
    ? new Date(participantResult.data.last_seen_at)
    : null;
  const mutedUntil = participantResult.data?.muted_until
    ? new Date(participantResult.data.muted_until)
    : null;

  let unreadCount = messageCount;
  if (lastSeenAt) {
    const { count: unreadCountValue, error: unreadError } = await supabaseAdmin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conversation.id)
      .is("deleted_at", null)
      .gt("created_at", lastSeenAt.toISOString());

    if (unreadError) {
      console.error("Error fetching unread count:", unreadError);
    } else if (typeof unreadCountValue === "number") {
      unreadCount = unreadCountValue;
    }
  }

  const isMuted = Boolean(mutedUntil && mutedUntil > new Date());

  return {
    ...conversation,
    unread_count: unreadCount,
    message_count: messageCount,
    last_message_preview: lastMessagePreview,
    participant_count: participantCount,
    is_muted: isMuted,
  };
}

async function getDirectConversationId(
  userId: string,
  otherUserId: string,
): Promise<ActionResult<string | null>> {
  const { data: userRows, error: userError } = await supabaseAdmin
    .from("conversation_participants")
    .select("conversation_id, conversations!inner(id, type)")
    .eq("user_id", userId)
    .eq("conversations.type", "direct");

  if (userError) {
    console.error("Error fetching direct conversations for user:", userError);
    return { success: false, error: "Failed to check existing conversations" };
  }

  const { data: otherRows, error: otherError } = await supabaseAdmin
    .from("conversation_participants")
    .select("conversation_id, conversations!inner(id, type)")
    .eq("user_id", otherUserId)
    .eq("conversations.type", "direct");

  if (otherError) {
    console.error(
      "Error fetching direct conversations for other user:",
      otherError,
    );
    return { success: false, error: "Failed to check existing conversations" };
  }

  const userConversationIds = new Set(
    (userRows || []).map((row) => row.conversation_id),
  );

  const sharedConversationId = (otherRows || [])
    .map((row) => row.conversation_id)
    .find((id) => userConversationIds.has(id));

  return { success: true, data: sharedConversationId || null };
}

export async function createDirectConversation(
  otherUserId: string,
): Promise<ActionResult<Conversation>> {
  try {
    if (!otherUserId) {
      return { success: false, error: "Other user ID is required" };
    }

    const sessionResult = await getSessionUserId();
    if (!sessionResult.success || !sessionResult.data) {
      return { success: false, error: "Invalid session" };
    }

    const userId = sessionResult.data;
    if (userId === otherUserId) {
      return {
        success: false,
        error: "Cannot start a conversation with yourself",
      };
    }

    // ensure the other user exists before proceeding
    const { data: otherUser, error: otherUserError } = await supabaseAdmin
      .from("user")
      .select("id")
      .eq("id", otherUserId)
      .maybeSingle();

    if (otherUserError) {
      console.error("Error checking other user existence:", otherUserError);
      return { success: false, error: "Failed to verify user" };
    }

    if (!otherUser) {
      return { success: false, error: "User not found" };
    }

    const existingIdResult = await getDirectConversationId(userId, otherUserId);
    if (!existingIdResult.success) {
      return existingIdResult as ActionResult<Conversation>;
    }

    if (existingIdResult.data) {
      const { data: existingConversation, error } = await supabaseAdmin
        .from("conversations")
        .select("*")
        .eq("id", existingIdResult.data)
        .maybeSingle();

      if (error) {
        console.error("Error fetching existing conversation:", error);
        return { success: false, error: "Failed to fetch conversation" };
      }

      if (!existingConversation) {
        return { success: false, error: "Conversation not found" };
      }

      return { success: true, data: existingConversation as Conversation };
    }

    const { data: newConversation, error: createError } = await supabaseAdmin
      .from("conversations")
      .insert({
        type: "direct",
      })
      .select("*")
      .single();

    if (createError) {
      console.error("Error creating direct conversation:", createError);
      return { success: false, error: "Failed to create conversation" };
    }

    const { error: participantError } = await supabaseAdmin
      .from("conversation_participants")
      .insert([
        {
          conversation_id: newConversation.id,
          user_id: userId,
          role: "owner",
          can_send_messages: true,
          can_add_participants: true,
        },
        {
          conversation_id: newConversation.id,
          user_id: otherUserId,
          role: "member",
          can_send_messages: true,
          can_add_participants: false,
        },
      ]);

    if (participantError) {
      console.error(
        "Error adding direct conversation participants:",
        participantError,
      );
      // clean up partial conversation if insertion failed
      await supabaseAdmin
        .from("conversations")
        .delete()
        .eq("id", newConversation.id);
      return {
        success: false,
        error: "Failed to add conversation participants",
      };
    }

    return { success: true, data: newConversation as Conversation };
  } catch (err) {
    console.error("Unexpected error in createDirectConversation:", err);
    return { success: false, error: "Unexpected error creating conversation" };
  }
}

export async function getConversation(
  conversationId: string,
): Promise<ActionResult<ConversationWithMetadata>> {
  try {
    if (!conversationId) {
      return { success: false, error: "Conversation ID is required" };
    }

    const sessionResult = await getSessionUserId();
    if (!sessionResult.success || !sessionResult.data) {
      return { success: false, error: "Invalid session" };
    }

    const userId = sessionResult.data;
    const accessResult = await checkConversationAccess(userId, conversationId);

    if (!accessResult.success) {
      return { success: false, error: accessResult.error };
    }

    if (!accessResult.data) {
      return { success: false, error: "Access denied" };
    }

    const { data: conversation, error } = await supabaseAdmin
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching conversation:", error);
      return { success: false, error: "Failed to fetch conversation" };
    }

    if (!conversation) {
      return { success: false, error: "Conversation not found" };
    }

    const withMetadata = await buildConversationWithMetadata(
      conversation as Conversation,
      userId,
    );

    return { success: true, data: withMetadata };
  } catch (err) {
    console.error("Unexpected error in getConversation:", err);
    return { success: false, error: "Unexpected error fetching conversation" };
  }
}

export async function getUserConversations(): Promise<
  ActionResult<ConversationWithMetadata[]>
> {
  try {
    const sessionResult = await getSessionUserId();
    if (!sessionResult.success || !sessionResult.data) {
      return { success: false, error: "Invalid session" };
    }

    const userId = sessionResult.data;

    const { data: directRows, error: directError } = await supabaseAdmin
      .from("conversation_participants")
      .select("conversations(*)")
      .eq("user_id", userId);

    if (directError) {
      console.error("Error fetching direct conversations:", directError);
      return { success: false, error: "Failed to fetch conversations" };
    }

    const directConversations = (directRows || [])
      .map((row) => row.conversations)
      .filter(
        (conversation): conversation is Conversation =>
          Boolean(conversation) && conversation.type === "direct",
      );

    const { data: userGroupMemberships, error: groupMemberError } =
      await supabaseAdmin
        .from("user_group_member")
        .select("user_group_id")
        .eq("user_id", userId);

    if (groupMemberError) {
      console.error("Error fetching user group memberships:", groupMemberError);
      return { success: false, error: "Failed to fetch conversations" };
    }

    const userGroupIds = (userGroupMemberships || []).map(
      (membership) => membership.user_group_id,
    );

    const { data: userGroupConversations, error: userGroupError } =
      userGroupIds.length > 0
        ? await supabaseAdmin
            .from("conversations")
            .select("*")
            .eq("type", "user_group")
            .in("user_group_id", userGroupIds)
        : { data: [], error: null };

    if (userGroupError) {
      console.error("Error fetching user group conversations:", userGroupError);
      return { success: false, error: "Failed to fetch conversations" };
    }

    const { data: eventUserStates, error: eventStateError } =
      await supabaseAdmin
        .from("event_user_state")
        .select("event_id")
        .eq("user_id", userId);

    if (eventStateError) {
      console.error("Error fetching event access:", eventStateError);
      return { success: false, error: "Failed to fetch conversations" };
    }

    const { data: directEventGroupAccess, error: directGroupAccessError } =
      await supabaseAdmin
        .from("event_group_access")
        .select("event_group_id")
        .eq("user_id", userId);

    if (directGroupAccessError) {
      console.error(
        "Error fetching event group access:",
        directGroupAccessError,
      );
      return { success: false, error: "Failed to fetch conversations" };
    }

    const { data: userGroupEventAccess, error: groupAccessError } =
      userGroupIds.length > 0
        ? await supabaseAdmin
            .from("event_group_access")
            .select("event_group_id")
            .in("user_group_id", userGroupIds)
        : { data: [], error: null };

    if (groupAccessError) {
      console.error(
        "Error fetching group-based event access:",
        groupAccessError,
      );
      return { success: false, error: "Failed to fetch conversations" };
    }

    const eventGroupIds = new Set(
      [...(directEventGroupAccess || []), ...(userGroupEventAccess || [])].map(
        (entry) => entry.event_group_id,
      ),
    );

    const { data: eventGroupEvents, error: eventGroupEventsError } =
      eventGroupIds.size > 0
        ? await supabaseAdmin
            .from("event")
            .select("id")
            .in("event_group_id", [...eventGroupIds])
        : { data: [], error: null };

    if (eventGroupEventsError) {
      console.error(
        "Error fetching event group events:",
        eventGroupEventsError,
      );
      return { success: false, error: "Failed to fetch conversations" };
    }

    const eventIdsFromStates = (eventUserStates || []).map(
      (entry) => entry.event_id,
    );
    const eventIdsFromGroups = (eventGroupEvents || []).map(
      (entry) => entry.id,
    );
    const eventIds = new Set([...eventIdsFromStates, ...eventIdsFromGroups]);

    const { data: eventConversations, error: eventConversationsError } =
      eventIds.size > 0
        ? await supabaseAdmin
            .from("conversations")
            .select("*")
            .eq("type", "event")
            .in("event_id", [...eventIds])
        : { data: [], error: null };

    if (eventConversationsError) {
      console.error(
        "Error fetching event conversations:",
        eventConversationsError,
      );
      return { success: false, error: "Failed to fetch conversations" };
    }

    const conversationMap = new Map<string, Conversation>();

    [...directConversations, ...(userGroupConversations || [])].forEach(
      (conversation) => {
        conversationMap.set(conversation.id, conversation as Conversation);
      },
    );

    (eventConversations || []).forEach((conversation) => {
      conversationMap.set(conversation.id, conversation as Conversation);
    });

    const conversations = [...conversationMap.values()];

    const conversationsWithMetadata = await Promise.all(
      conversations.map((conversation) =>
        buildConversationWithMetadata(conversation, userId),
      ),
    );

    conversationsWithMetadata.sort((a, b) => {
      const aTime = a.last_message_at
        ? new Date(a.last_message_at).getTime()
        : 0;
      const bTime = b.last_message_at
        ? new Date(b.last_message_at).getTime()
        : 0;
      return bTime - aTime;
    });

    return { success: true, data: conversationsWithMetadata };
  } catch (err) {
    console.error("Unexpected error in getUserConversations:", err);
    return { success: false, error: "Unexpected error fetching conversations" };
  }
}

export async function updateConversation(
  conversationId: string,
  updates: ConversationUpdate,
): Promise<ActionResult<Conversation>> {
  try {
    if (!conversationId) {
      return { success: false, error: "Conversation ID is required" };
    }

    if (!updates.name && !updates.description && !updates.avatar_url) {
      return { success: false, error: "No updates provided" };
    }

    const sessionResult = await getSessionUserId();
    if (!sessionResult.success || !sessionResult.data) {
      return { success: false, error: "Invalid session" };
    }

    const userId = sessionResult.data;

    const { data: conversation, error: conversationError } = await supabaseAdmin
      .from("conversations")
      .select("id, type")
      .eq("id", conversationId)
      .maybeSingle();

    if (conversationError) {
      console.error("Error fetching conversation:", conversationError);
      return { success: false, error: "Failed to update conversation" };
    }

    if (!conversation) {
      return { success: false, error: "Conversation not found" };
    }

    if (conversation.type !== "direct") {
      return {
        success: false,
        error: "Only direct conversations can be updated",
      };
    }

    const { data: participant, error: participantError } = await supabaseAdmin
      .from("conversation_participants")
      .select("role")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .maybeSingle();

    if (participantError) {
      console.error("Error fetching participant role:", participantError);
      return { success: false, error: "Failed to update conversation" };
    }

    if (!participant || !["admin", "owner"].includes(participant.role || "")) {
      return { success: false, error: "Access denied" };
    }

    const { data: updatedConversation, error: updateError } =
      await supabaseAdmin
        .from("conversations")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId)
        .select("*")
        .single();

    if (updateError) {
      console.error("Error updating conversation:", updateError);
      return { success: false, error: "Failed to update conversation" };
    }

    return { success: true, data: updatedConversation as Conversation };
  } catch (err) {
    console.error("Unexpected error in updateConversation:", err);
    return { success: false, error: "Unexpected error updating conversation" };
  }
}

export async function deleteConversation(
  conversationId: string,
): Promise<ActionResult<void>> {
  try {
    if (!conversationId) {
      return { success: false, error: "Conversation ID is required" };
    }

    const sessionResult = await getSessionUserId();
    if (!sessionResult.success || !sessionResult.data) {
      return { success: false, error: "Invalid session" };
    }

    const userId = sessionResult.data;

    const { data: conversation, error: conversationError } = await supabaseAdmin
      .from("conversations")
      .select("id, type")
      .eq("id", conversationId)
      .maybeSingle();

    if (conversationError) {
      console.error("Error fetching conversation:", conversationError);
      return { success: false, error: "Failed to delete conversation" };
    }

    if (!conversation) {
      return { success: false, error: "Conversation not found" };
    }

    if (conversation.type !== "direct") {
      return {
        success: false,
        error: "Only direct conversations can be deleted",
      };
    }

    const { data: participant, error: participantError } = await supabaseAdmin
      .from("conversation_participants")
      .select("role")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .maybeSingle();

    if (participantError) {
      console.error("Error fetching participant role:", participantError);
      return { success: false, error: "Failed to delete conversation" };
    }

    if (!participant || participant.role !== "owner") {
      return { success: false, error: "Access denied" };
    }

    const { error: deleteError } = await supabaseAdmin
      .from("conversations")
      .delete()
      .eq("id", conversationId);

    if (deleteError) {
      console.error("Error deleting conversation:", deleteError);
      return { success: false, error: "Failed to delete conversation" };
    }

    return { success: true, data: undefined };
  } catch (err) {
    console.error("Unexpected error in deleteConversation:", err);
    return { success: false, error: "Unexpected error deleting conversation" };
  }
}

// -----------------------------
// Message helpers & operations
// -----------------------------

async function buildMessageWithSender(
  message: Message,
): Promise<MessageWithSender> {
  // fetch sender basic info
  const { data: senderData, error: senderError } = await supabaseAdmin
    .from("user")
    .select("id, name, image")
    .eq("id", message.sender_id)
    .maybeSingle();

  if (senderError) {
    console.error("Error fetching sender:", senderError);
  }

  const sender = senderData || {
    id: message.sender_id,
    name: "",
    image: null,
  };

  let replyInfo;
  if (message.reply_to_id) {
    const { data: replyRow, error: replyError } = await supabaseAdmin
      .from("messages")
      .select("content, sender_id")
      .eq("id", message.reply_to_id)
      .maybeSingle();

    if (replyError) {
      console.error("Error fetching reply message:", replyError);
    }

    if (replyRow) {
      const { data: replySender, error: replySenderError } = await supabaseAdmin
        .from("user")
        .select("name")
        .eq("id", replyRow.sender_id)
        .maybeSingle();
      if (replySenderError) {
        console.error("Error fetching reply sender:", replySenderError);
      }

      replyInfo = {
        content: replyRow.content,
        sender_name: replySender?.name || "",
      };
    }
  }

  const result: MessageWithSender = {
    ...message,
    sender: { id: sender.id, name: sender.name, image: sender.image || null },
    ...(replyInfo ? { reply_to_message: replyInfo } : {}),
  };

  return result;
}

export async function sendMessage(
  conversationId: string,
  content: string,
  options?: {
    replyToId?: string;
    meetingId?: string;
    contentType?: "text" | "image" | "file";
  },
): Promise<ActionResult<MessageWithSender>> {
  try {
    if (!conversationId) {
      return { success: false, error: "Conversation ID is required" };
    }

    if (!content) {
      return { success: false, error: "Message content is required" };
    }

    const sessionResult = await getSessionUserId();
    if (!sessionResult.success || !sessionResult.data) {
      return { success: false, error: "Invalid session" };
    }

    const userId = sessionResult.data;

    const { data: participant, error: participantError } = await supabaseAdmin
      .from("conversation_participants")
      .select("can_send_messages")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .maybeSingle();

    if (participantError) {
      console.error(
        "Error checking participant permissions:",
        participantError,
      );
      return { success: false, error: "Failed to send message" };
    }

    if (!participant || !participant.can_send_messages) {
      return { success: false, error: "Access denied" };
    }

    const { data: newMessage, error: insertError } = await supabaseAdmin
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content,
        content_type: options?.contentType ?? "text",
        reply_to_id: options?.replyToId ?? null,
        meeting_id: options?.meetingId ?? null,
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("Error inserting message:", insertError);
      return { success: false, error: "Failed to send message" };
    }

    const withSender = await buildMessageWithSender(newMessage as Message);

    return { success: true, data: withSender };
  } catch (err) {
    console.error("Unexpected error in sendMessage:", err);
    return { success: false, error: "Unexpected error sending message" };
  }
}

export async function getMessageById(
  messageId: string,
): Promise<ActionResult<MessageWithSender>> {
  try {
    if (!messageId) {
      return { success: false, error: "Message ID is required" };
    }

    const sessionResult = await getSessionUserId();
    if (!sessionResult.success || !sessionResult.data) {
      return { success: false, error: "Invalid session" };
    }

    const { data: message, error } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("id", messageId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching message:", error);
      return { success: false, error: "Failed to fetch message" };
    }

    if (!message) {
      return { success: false, error: "Message not found" };
    }

    const withSender = await buildMessageWithSender(message as Message);
    return { success: true, data: withSender };
  } catch (err) {
    console.error("Unexpected error in getMessageById:", err);
    return { success: false, error: "Unexpected error fetching message" };
  }
}

export async function getMessages(
  conversationId: string,
  options?: { limit?: number; before?: string },
): Promise<
  ActionResult<{
    messages: MessageWithSender[];
    hasMore: boolean;
    oldestMessageDate: string | null;
  }>
> {
  try {
    if (!conversationId) {
      return { success: false, error: "Conversation ID is required" };
    }

    const sessionResult = await getSessionUserId();
    if (!sessionResult.success || !sessionResult.data) {
      return { success: false, error: "Invalid session" };
    }

    const limit = options?.limit ?? 50;
    const before = options?.before;

    let query = supabaseAdmin
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (before) {
      query = query.lt("created_at", before);
    }

    query = query.limit(limit + 1);

    const { data: rows, error } = await query;

    if (error) {
      console.error("Error fetching messages:", error);
      return { success: false, error: "Failed to fetch messages" };
    }

    const messageList = (rows || []) as Message[];
    const hasMore = messageList.length > limit;
    const sliced = messageList.slice(0, limit);
    const messagesWithSender = await Promise.all(
      sliced.map((m) => buildMessageWithSender(m)),
    );

    const oldestMessageDate = messagesWithSender.length
      ? messagesWithSender[messagesWithSender.length - 1].created_at
      : null;

    return {
      success: true,
      data: {
        messages: messagesWithSender,
        hasMore,
        oldestMessageDate,
      },
    };
  } catch (err) {
    console.error("Unexpected error in getMessages:", err);
    return { success: false, error: "Unexpected error fetching messages" };
  }
}

export async function editMessage(
  messageId: string,
  newContent: string,
): Promise<ActionResult<Message>> {
  try {
    if (!messageId) {
      return { success: false, error: "Message ID is required" };
    }
    if (!newContent) {
      return { success: false, error: "New content is required" };
    }

    const sessionResult = await getSessionUserId();
    if (!sessionResult.success || !sessionResult.data) {
      return { success: false, error: "Invalid session" };
    }

    const userId = sessionResult.data;

    const { data: updated, error } = await supabaseAdmin
      .from("messages")
      .update({ content: newContent, edited_at: new Date().toISOString() })
      .eq("id", messageId)
      .eq("sender_id", userId)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Error editing message:", error);
      return { success: false, error: "Failed to edit message" };
    }

    if (!updated) {
      return { success: false, error: "Message not found or access denied" };
    }

    return { success: true, data: updated as Message };
  } catch (err) {
    console.error("Unexpected error in editMessage:", err);
    return { success: false, error: "Unexpected error editing message" };
  }
}

export async function deleteMessage(
  messageId: string,
): Promise<ActionResult<void>> {
  try {
    if (!messageId) {
      return { success: false, error: "Message ID is required" };
    }

    const sessionResult = await getSessionUserId();
    if (!sessionResult.success || !sessionResult.data) {
      return { success: false, error: "Invalid session" };
    }

    const userId = sessionResult.data;

    const { error } = await supabaseAdmin
      .from("messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", messageId)
      .eq("sender_id", userId);

    if (error) {
      console.error("Error deleting message:", error);
      return { success: false, error: "Failed to delete message" };
    }

    return { success: true, data: undefined };
  } catch (err) {
    console.error("Unexpected error in deleteMessage:", err);
    return { success: false, error: "Unexpected error deleting message" };
  }
}

export async function markConversationAsRead(
  conversationId: string,
): Promise<ActionResult<void>> {
  try {
    if (!conversationId) {
      return { success: false, error: "Conversation ID is required" };
    }

    const sessionResult = await getSessionUserId();
    if (!sessionResult.success || !sessionResult.data) {
      return { success: false, error: "Invalid session" };
    }

    const userId = sessionResult.data;

    const { error } = await supabaseAdmin
      .from("conversation_participants")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error marking conversation read:", error);
      return { success: false, error: "Failed to mark as read" };
    }

    return { success: true, data: undefined };
  } catch (err) {
    console.error("Unexpected error in markConversationAsRead:", err);
    return {
      success: false,
      error: "Unexpected error marking conversation as read",
    };
  }
}
