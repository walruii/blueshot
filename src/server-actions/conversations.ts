"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  formatInboxDirect,
  formatInboxGroup,
  InboxDirect,
  InboxGroup,
} from "@/types/chat";
import { Result } from "@/types/returnType";
import { headers } from "next/headers";
import { Role } from "@/types/permission";

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

    return data.map(formatInboxDirect);
  } catch (err) {
    console.error("Error fetching direct conversations:", err);
    return [];
  }
}

export async function getGroupConversationById(
  conversationId: string,
): Promise<InboxGroup | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return null;
    if (!conversationId) return null;

    const { data, error } = await supabaseAdmin
      .from("group_conversations_inbox")
      .select()
      .eq("current_user_id", session.user.id)
      .eq("id", conversationId)
      .maybeSingle();

    if (error) throw error;
    return data ? formatInboxGroup(data) : null;
  } catch (err) {
    console.error("Error fetching group conversation by id:", err);
    return null;
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

  return data.map(formatInboxGroup);
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

    // Broadcast to both the recipient and the creator so they can update their
    // inbox lists simultaneously.  This ensures the sidebar revalidates no
    // matter who triggered the creation (client will also navigate).
    try {
      const { data: targetUserProfile } = await supabaseAdmin
        .from("user")
        .select("name")
        .eq("id", targetUser.id)
        .single();

      await Promise.all([
        supabaseAdmin.channel(`user_inbox_${targetUser.id}`).send({
          type: "broadcast",
          event: "NEW_DIRECT_CONVERSATION",
          payload: {
            conversationId: conversation.id,
            initiatorName: session.user.name,
          },
        }),
        supabaseAdmin.channel(`user_inbox_${session.user.id}`).send({
          type: "broadcast",
          event: "NEW_DIRECT_CONVERSATION",
          payload: {
            conversationId: conversation.id,
            initiatorName: targetUserProfile?.name,
          },
        }),
      ]);
    } catch (broadcastErr) {
      console.error(
        "Failed to broadcast new direct conversation",
        broadcastErr,
      );
    }

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
    return data ? formatInboxDirect(data) : null;
  } catch (err) {
    console.error("Error fetching direct conversation by id:", err);
    return null;
  }
}

export async function createUserGroupConversation(args: {
  userGroupId: string;
  name?: string;
  description?: string;
  avatarUrl?: string;
}): Promise<Result<string>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, error: "Unauthorized" };

    if (!args.userGroupId) {
      return { success: false, error: "User group is required" };
    }

    const { data: group, error: groupError } = await supabaseAdmin
      .from("user_group")
      .select("id, name, created_by")
      .eq("id", args.userGroupId)
      .maybeSingle();

    if (groupError || !group) {
      return { success: false, error: "User group not found" };
    }

    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("user_group_member")
      .select("user_id")
      .eq("user_group_id", args.userGroupId)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (membershipError) {
      return { success: false, error: "Failed to verify access" };
    }

    if (group.created_by !== session.user.id && !membership) {
      return { success: false, error: "Access denied" };
    }

    const { data: conversation, error: convError } = await supabaseAdmin
      .from("conversation")
      .insert({
        type: "user_group",
        user_group_id: args.userGroupId,
        name: args.name?.trim() || group.name,
        description: args.description?.trim() || null,
        avatar_url: args.avatarUrl?.trim() || null,
      })
      .select("id")
      .single();

    if (convError || !conversation) {
      return {
        success: false,
        error: convError?.message || "Failed to create conversation",
      };
    }

    const { data: members, error: membersError } = await supabaseAdmin
      .from("user_group_member")
      .select("user_id")
      .eq("user_group_id", args.userGroupId);

    if (membersError) {
      return { success: false, error: "Failed to fetch group members" };
    }

    const participantIds = new Set<string>(
      (members || []).map((m) => m.user_id).filter(Boolean),
    );
    participantIds.add(session.user.id);

    const participantRows = Array.from(participantIds).map((userId) => ({
      conversation_id: conversation.id,
      user_id: userId,
      role: userId === group.created_by ? "owner" : "member",
    }));

    const { error: participantError } = await supabaseAdmin
      .from("conversation_participant")
      .insert(participantRows);

    if (participantError) {
      return {
        success: false,
        error: participantError.message || "Failed to add participants",
      };
    }

    try {
      await Promise.all(
        Array.from(participantIds).map((userId) =>
          supabaseAdmin.channel(`user_inbox_${userId}`).send({
            type: "broadcast",
            event: "NEW_GROUP_CONVERSATION",
            payload: {
              conversationId: conversation.id,
              groupName: args.name?.trim() || group.name,
            },
          }),
        ),
      );
    } catch (broadcastErr) {
      console.error(
        "Failed to broadcast new user-group conversation",
        broadcastErr,
      );
    }

    return { success: true, data: conversation.id };
  } catch (err) {
    console.error("createUserGroupConversation failed", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function createEventGroupConversation(args: {
  eventGroupId: string;
  name?: string;
  description?: string;
  avatarUrl?: string;
}): Promise<Result<string>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, error: "Unauthorized" };

    if (!args.eventGroupId) {
      return { success: false, error: "Event group is required" };
    }

    const { data: eventGroup, error: eventGroupError } = await supabaseAdmin
      .from("event_group")
      .select("id, name, created_by")
      .eq("id", args.eventGroupId)
      .maybeSingle();

    if (eventGroupError || !eventGroup) {
      return { success: false, error: "Event group not found" };
    }

    const { data: accessRows, error: accessError } = await supabaseAdmin
      .from("event_group_access")
      .select("user_id, user_group_id")
      .eq("event_group_id", args.eventGroupId);

    if (accessError) {
      return { success: false, error: "Failed to verify access" };
    }

    const directUserIds = new Set<string>(
      (accessRows || [])
        .map((row) => row.user_id)
        .filter((id): id is string => Boolean(id)),
    );

    const accessUserGroupIds = Array.from(
      new Set(
        (accessRows || [])
          .map((row) => row.user_group_id)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    let groupMemberRows: { user_id: string }[] = [];
    if (accessUserGroupIds.length > 0) {
      const { data: viaGroup, error: viaGroupError } = await supabaseAdmin
        .from("user_group_member")
        .select("user_id")
        .in("user_group_id", accessUserGroupIds);

      if (viaGroupError) {
        return {
          success: false,
          error: "Failed to resolve event-group members",
        };
      }

      groupMemberRows = (viaGroup || []) as { user_id: string }[];
    }

    const participantIds = new Set<string>([
      ...Array.from(directUserIds),
      ...groupMemberRows.map((r) => r.user_id),
      eventGroup.created_by,
    ]);

    const hasAccess = participantIds.has(session.user.id);
    if (!hasAccess) {
      return { success: false, error: "Access denied" };
    }

    const { data: conversation, error: convError } = await supabaseAdmin
      .from("conversation")
      .insert({
        type: "event_group",
        event_group_id: args.eventGroupId,
        name: args.name?.trim() || eventGroup.name,
        description: args.description?.trim() || null,
        avatar_url: args.avatarUrl?.trim() || null,
      } as any)
      .select("id")
      .single();

    if (convError || !conversation) {
      return {
        success: false,
        error: convError?.message || "Failed to create conversation",
      };
    }

    const participantRows = Array.from(participantIds).map((userId) => ({
      conversation_id: conversation.id,
      user_id: userId,
      role: userId === eventGroup.created_by ? "owner" : "member",
    }));

    const { error: participantError } = await supabaseAdmin
      .from("conversation_participant")
      .insert(participantRows);

    if (participantError) {
      return {
        success: false,
        error: participantError.message || "Failed to add participants",
      };
    }

    try {
      await Promise.all(
        Array.from(participantIds).map((userId) =>
          supabaseAdmin.channel(`user_inbox_${userId}`).send({
            type: "broadcast",
            event: "NEW_GROUP_CONVERSATION",
            payload: {
              conversationId: conversation.id,
              groupName: args.name?.trim() || eventGroup.name,
            },
          }),
        ),
      );
    } catch (broadcastErr) {
      console.error(
        "Failed to broadcast new event-group conversation",
        broadcastErr,
      );
    }

    return { success: true, data: conversation.id };
  } catch (err) {
    console.error("createEventGroupConversation failed", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateGroupConversationSettings(args: {
  conversationId: string;
  name: string;
  description?: string | null;
  avatarUrl?: string | null;
}): Promise<Result<InboxGroup>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, error: "Unauthorized" };

    const trimmedName = args.name.trim();
    if (!args.conversationId) {
      return { success: false, error: "Conversation id is required" };
    }
    if (!trimmedName) {
      return { success: false, error: "Group name is required" };
    }

    const { data: conversation, error: convFetchError } = await supabaseAdmin
      .from("conversation")
      .select("id, type, user_group_id, event_group_id")
      .eq("id", args.conversationId)
      .maybeSingle();

    if (convFetchError || !conversation) {
      return { success: false, error: "Conversation not found" };
    }

    if (
      conversation.type !== "user_group" &&
      conversation.type !== "event_group"
    ) {
      return {
        success: false,
        error: "Settings are only available for group chats",
      };
    }

    let canManage = false;

    if (conversation.type === "user_group") {
      if (!conversation.user_group_id) {
        return { success: false, error: "Invalid user group conversation" };
      }

      const { data: group, error: groupError } = await supabaseAdmin
        .from("user_group")
        .select("created_by")
        .eq("id", conversation.user_group_id)
        .maybeSingle();

      if (groupError || !group) {
        return { success: false, error: "User group not found" };
      }

      canManage = group.created_by === session.user.id;
    }

    if (conversation.type === "event_group") {
      if (!conversation.event_group_id) {
        return { success: false, error: "Invalid event group conversation" };
      }

      const { data: eventGroup, error: eventGroupError } = await supabaseAdmin
        .from("event_group")
        .select("created_by")
        .eq("id", conversation.event_group_id)
        .maybeSingle();

      if (eventGroupError || !eventGroup) {
        return { success: false, error: "Event group not found" };
      }

      if (eventGroup.created_by === session.user.id) {
        canManage = true;
      } else {
        const { data: directWriteAccess } = await supabaseAdmin
          .from("event_group_access")
          .select("id")
          .eq("event_group_id", conversation.event_group_id)
          .eq("user_id", session.user.id)
          .gte("role", Role.READ_WRITE)
          .limit(1)
          .maybeSingle();

        if (directWriteAccess) {
          canManage = true;
        } else {
          const { data: memberships } = await supabaseAdmin
            .from("user_group_member")
            .select("user_group_id")
            .eq("user_id", session.user.id);

          const userGroupIds = (memberships || []).map((m) => m.user_group_id);
          if (userGroupIds.length > 0) {
            const { data: groupWriteAccess } = await supabaseAdmin
              .from("event_group_access")
              .select("id")
              .eq("event_group_id", conversation.event_group_id)
              .in("user_group_id", userGroupIds)
              .gte("role", Role.READ_WRITE)
              .limit(1)
              .maybeSingle();

            canManage = Boolean(groupWriteAccess);
          }
        }
      }
    }

    if (!canManage) {
      return { success: false, error: "Access denied" };
    }

    const cleanedAvatar = args.avatarUrl?.trim() || null;
    const cleanedDescription = args.description?.trim() || null;

    const { error: updateError } = await supabaseAdmin
      .from("conversation")
      .update({
        name: trimmedName,
        description: cleanedDescription,
        avatar_url: cleanedAvatar,
      })
      .eq("id", args.conversationId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    const { data: participantRows } = await supabaseAdmin
      .from("conversation_participant")
      .select("user_id")
      .eq("conversation_id", args.conversationId);

    try {
      await Promise.all(
        (participantRows || []).map((row) =>
          supabaseAdmin.channel(`user_inbox_${row.user_id}`).send({
            type: "broadcast",
            event: "GROUP_CONVERSATION_UPDATED",
            payload: {
              conversationId: args.conversationId,
            },
          }),
        ),
      );
    } catch (broadcastErr) {
      console.error(
        "Failed to broadcast group conversation update",
        broadcastErr,
      );
    }

    const updated = await getGroupConversationById(args.conversationId);
    if (!updated) {
      return { success: false, error: "Failed to fetch updated conversation" };
    }

    return { success: true, data: updated };
  } catch (err) {
    console.error("updateGroupConversationSettings failed", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}
