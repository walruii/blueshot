"use server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Database } from "@/types/database.types";
import { formatNotification, NotificationJSON } from "@/types/notification";
import { PermissionEntry } from "@/types/permission";
import { headers } from "next/headers";
import { Result } from "@/types/returnType";

export interface CreatorInfo {
  name: string;
  email: string;
}

async function insertNotifications(
  userIds: string[],
  type: string,
  title: string,
  payload: NotificationJSON,
  priority: number = 1,
): Promise<void> {
  if (userIds.length === 0) return;

  const notifications = userIds.map((userId) => ({
    user_id: userId,
    type,
    title,
    payload,
    priority,
  }));

  const { error } = await supabaseAdmin
    .from("notifications")
    .insert(notifications);

  if (error) {
    console.error("Error inserting notifications:", error);
  }
}

export const getNotifications = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) return [];

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", session.user.id!)
      .is("archived", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error getting notifications", error);
      return [];
    }

    return data.map(formatNotification);
  } catch (err) {
    console.error(err);
    return [];
  }
};

export async function getAffectedUserIds(
  eventDb: Database["public"]["Tables"]["event"]["Row"],
  permissions?: PermissionEntry[],
): Promise<Set<string>> {
  const userIds = new Set<string>();
  const queries: Promise<void>[] = [];

  const emails =
    permissions?.filter((p) => p.type === "email").map((e) => e.identifier) ||
    [];
  if (emails.length > 0) {
    queries.push(
      (async () => {
        const { data } = await supabaseAdmin
          .from("user")
          .select("id")
          .in("email", emails);
        data?.forEach((u) => userIds.add(u.id));
      })(),
    );
  }

  queries.push(
    (async () => {
      const { data } = await supabaseAdmin
        .from("view_all_event_access")
        .select("user_id")
        .eq("event_id", eventDb.id);

      data?.forEach((row) => {
        if (row.user_id) userIds.add(row.user_id);
      });
    })(),
  );

  await Promise.all(queries);
  return userIds;
}

export async function notifyAffectedUsers(
  eventDb: Database["public"]["Tables"]["event"]["Row"],
  notifyType: "NEW_EVENT" | "DELETE_EVENT",
  creator: CreatorInfo,
  permissions?: PermissionEntry[],
): Promise<void> {
  try {
    const userIdsSet = await getAffectedUserIds(eventDb, permissions);

    // Remove the creator so they don't notify themselves
    userIdsSet.delete(eventDb.created_by);

    const userIds = Array.from(userIdsSet);

    // Build notification title and payload
    const title =
      notifyType === "NEW_EVENT"
        ? `New event: ${eventDb.title}`
        : `Event deleted: ${eventDb.title}`;

    const payload: NotificationJSON = {
      type: "EVENT_ACTION",
      eventId: eventDb.id,
      eventTitle: eventDb.title,
      eventUserName: creator.name,
      eventEmail: creator.email,
      eventFrom: eventDb.from,
      eventTo: eventDb.to,
    };

    // Insert persistent notifications to DB
    await insertNotifications(userIds, notifyType, title, payload);

    // Parallel broadcast for real-time toast
    await Promise.all(
      userIds.map((userId) =>
        supabaseAdmin.channel(`user_inbox_${userId}`).send({
          type: "broadcast",
          event: notifyType,
          payload: { title: eventDb.title, from: eventDb.from },
        }),
      ),
    );

    console.log(`Successfully notified ${userIds.length} users.`);
  } catch (err) {
    console.error("Error in notifyAffectedUsers:", err);
  }
}

export const archiveNotification = async (
  id: string,
): Promise<Result<null>> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session)
      return { success: false, error: "Invalid session. Try again later." };

    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ archived: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error archiving notification:", error);
      return { success: false, error: "Failed to archive notification" };
    }

    return { success: true };
  } catch (err) {
    console.error("Error in archiveNotification:", err);
    return {
      success: false,
      error: "Internal server error archiving notification",
    };
  }
};

/**
 * Generic function to notify users about group/event access changes
 */
interface AccessNotificationConfig {
  userIds: string[];
  owner: CreatorInfo & { id: string };
  action: string;
  title: string;
  payload: NotificationJSON;
}

async function notifyAccessChange(config: AccessNotificationConfig): Promise<void> {
  const { userIds, owner, action, title, payload } = config;

  try {
    // Filter out the owner - they don't need to notify themselves
    const filteredUserIds = userIds.filter((id) => id !== owner.id);
    if (filteredUserIds.length === 0) return;

    await insertNotifications(filteredUserIds, action, title, payload);

    // Broadcast for real-time toast
    await Promise.all(
      filteredUserIds.map((userId) =>
        supabaseAdmin.channel(`user_inbox_${userId}`).send({
          type: "broadcast",
          event: action,
          payload: { title },
        }),
      ),
    );

    console.log(
      `Successfully notified ${filteredUserIds.length} users for ${action}.`,
    );
  } catch (err) {
    console.error(`Error in notifyAccessChange (${action}):`, err);
  }
}

/**
 * Notify users when they are added/removed from a user group
 */
export async function notifyUserGroupAction(
  userIds: string[],
  action: "ADDED_TO_USER_GROUP" | "REMOVED_FROM_USER_GROUP",
  groupId: string,
  groupName: string,
  owner: CreatorInfo & { id: string },
): Promise<void> {
  const title =
    action === "ADDED_TO_USER_GROUP"
      ? `Added to user group: ${groupName}`
      : `Removed from user group: ${groupName}`;

  const payload: NotificationJSON = {
    type: "USER_GROUP_ACTION",
    userGroupId: groupId,
    userGroupName: groupName,
    userGroupOwner: owner.id,
    userGroupOwnerName: owner.name,
    userGroupOwnerEmail: owner.email,
  };

  await notifyAccessChange({ userIds, owner, action, title, payload });
}

/**
 * Notify users when they are added/removed from an event group
 */
export async function notifyEventGroupAction(
  userIds: string[],
  action: "ADDED_TO_EVENT_GROUP" | "REMOVED_FROM_EVENT_GROUP",
  groupId: string,
  groupName: string,
  owner: CreatorInfo & { id: string },
): Promise<void> {
  const title =
    action === "ADDED_TO_EVENT_GROUP"
      ? `Added to event group: ${groupName}`
      : `Removed from event group: ${groupName}`;

  const payload: NotificationJSON = {
    type: "EVENT_GROUP_ACTION",
    eventGroupId: groupId,
    eventGroupName: groupName,
    eventGroupOwner: owner.id,
    eventGroupOwnerName: owner.name,
    eventGroupOwnerEmail: owner.email,
  };

  await notifyAccessChange({ userIds, owner, action, title, payload });
}

/**
 * Notify users when they are added/removed from a specific event
 */
export async function notifyEventAccessAction(
  userIds: string[],
  action: "ADDED_TO_EVENT" | "REMOVED_FROM_EVENT",
  eventId: string,
  eventTitle: string,
  owner: CreatorInfo & { id: string },
): Promise<void> {
  const title =
    action === "ADDED_TO_EVENT"
      ? `Added to event: ${eventTitle}`
      : `Removed from event: ${eventTitle}`;

  const payload: NotificationJSON = {
    type: "EVENT_ACTION",
    eventId: eventId,
    eventTitle: eventTitle,
    eventUserName: owner.name,
    eventEmail: owner.email,
    eventFrom: new Date().toISOString(), // Placeholder - actual event dates not available here
    eventTo: null,
  };

  await notifyAccessChange({ userIds, owner, action, title, payload });
}
